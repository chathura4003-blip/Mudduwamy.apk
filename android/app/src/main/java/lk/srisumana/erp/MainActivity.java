package lk.srisumana.erp;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (bridge != null && bridge.getWebView() != null) {
                WebView webView = bridge.getWebView();
                WebSettings settings = webView.getSettings();
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    settings.setOffscreenPreRaster(true);
                }
                webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
                webView.setOverScrollMode(WebView.OVER_SCROLL_IF_CONTENT_SCROLLS);
                webView.setScrollBarStyle(WebView.SCROLLBARS_INSIDE_OVERLAY);

                // Register Native Android Printer Bridge for window.print() and triggerUniversalPrint()
                webView.addJavascriptInterface(new AndroidPrinterInterface(this, webView), "AndroidPrinter");

                // Register Native Android PDF Opener & Downloader Bridge
                webView.addJavascriptInterface(new AndroidPdfOpenerInterface(this), "AndroidPdfOpener");

                // Register Native Download Listener for file downloads
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                        try {
                            if (url == null || url.startsWith("data:") || url.startsWith("blob:")) {
                                return;
                            }
                            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                            request.setMimeType(mimeType);
                            String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                            request.setTitle(fileName);
                            request.setDescription("බාගත වෙමින් පවතී (Downloading...)");
                            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                            if (dm != null) {
                                dm.enqueue(request);
                                Toast.makeText(MainActivity.this, "ගොනුව බාගත වීම ආරම්භ විය (Download Started)", Toast.LENGTH_SHORT).show();
                            }
                        } catch (Exception e) {
                            try {
                                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                startActivity(intent);
                            } catch (Exception ignored) {}
                        }
                    }
                });
            }
        } catch (Exception ignored) {}
    }

    public static class AndroidPrinterInterface {
        private final MainActivity activity;
        private final WebView webView;

        public AndroidPrinterInterface(MainActivity activity, WebView webView) {
            this.activity = activity;
            this.webView = webView;
        }

        @JavascriptInterface
        public void printPage(final String jobName) {
            activity.runOnUiThread(() -> {
                try {
                    PrintManager printManager = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null && webView != null) {
                        String safeJobName = (jobName != null && !jobName.trim().isEmpty())
                                ? jobName.trim()
                                : "Sri_Sumana_Pirivena_Document";
                        PrintDocumentAdapter printAdapter;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            printAdapter = webView.createPrintDocumentAdapter(safeJobName);
                        } else {
                            printAdapter = webView.createPrintDocumentAdapter();
                        }
                        printManager.print(safeJobName, printAdapter, new PrintAttributes.Builder().build());
                    }
                } catch (Exception e) {
                    Toast.makeText(activity, "මුද්‍රණය ආරම්භ කිරීමට නොහැකි විය (Print failed)", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    public static class AndroidPdfOpenerInterface {
        private final Context context;

        public AndroidPdfOpenerInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void openPdf(String url, String fileName) {
            try {
                if (url == null || url.trim().isEmpty()) return;
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(Uri.parse(url.trim()), "application/pdf");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                context.startActivity(Intent.createChooser(intent, "PDF ලේඛනය විවෘත කරන්න (Open PDF)"));
            } catch (Exception e) {
                try {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    browserIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(browserIntent);
                } catch (Exception ignored) {}
            }
        }

        @JavascriptInterface
        public void openPdfBase64(String base64Data, String fileName) {
            try {
                if (base64Data == null || base64Data.trim().isEmpty()) return;
                String cleanBase64 = base64Data;
                if (cleanBase64.contains(",")) {
                    cleanBase64 = cleanBase64.split(",")[1];
                }
                // Memory Guard: Reject excessively large Base64 blobs (> 25MB)
                if (cleanBase64.length() > 35 * 1024 * 1024) {
                    Toast.makeText(context, "PDF ලේඛනය විශාල වැඩිය (PDF file too large)", Toast.LENGTH_LONG).show();
                    return;
                }
                byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                String rawName = (fileName != null && !fileName.trim().isEmpty())
                        ? fileName.trim()
                        : "document_" + System.currentTimeMillis() + ".pdf";
                String safeFileName = rawName.replaceAll("[^a-zA-Z0-9._-]", "_");
                if (!safeFileName.toLowerCase().endsWith(".pdf")) {
                    safeFileName += ".pdf";
                }

                File cacheDir = new File(context.getCacheDir(), "pdf_docs");
                if (!cacheDir.exists()) {
                    cacheDir.mkdirs();
                }

                // Automatic temporary PDF cache cleanup: remove files older than 24h
                try {
                    File[] existingPdfs = cacheDir.listFiles();
                    if (existingPdfs != null && existingPdfs.length > 10) {
                        long cutoff = System.currentTimeMillis() - (24 * 60 * 60 * 1000);
                        for (File oldPdf : existingPdfs) {
                            if (oldPdf.lastModified() < cutoff || existingPdfs.length > 20) {
                                oldPdf.delete();
                            }
                        }
                    }
                } catch (Exception ignored) {}

                File pdfFile = new File(cacheDir, safeFileName);
                try (FileOutputStream fos = new FileOutputStream(pdfFile)) {
                    fos.write(pdfBytes);
                    fos.flush();
                }

                Uri contentUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        pdfFile
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(contentUri, "application/pdf");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                Intent chooser = Intent.createChooser(intent, "PDF ලේඛනය විවෘත කරන්න (Open PDF)");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);
            } catch (Exception e) {
                Toast.makeText(context, "PDF විවෘත කිරීමට නොහැකි විය: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }
}
