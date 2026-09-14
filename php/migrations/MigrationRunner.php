<?php
/**
 * Sri Sumana Maha Pirivena ERP — Database Migration Runner
 * Production-Grade, Idempotent, Non-Destructive Migration Engine
 */

class MigrationRunner {
    private $pdo;
    private $migrationsDir;

    public function __construct(PDO $pdo, $migrationsDir = null) {
        $this->pdo = $pdo;
        $this->migrationsDir = $migrationsDir ?: __DIR__;
    }

    /**
     * Ensure the migrations tracking table exists
     */
    public function ensureMigrationTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `migrations` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `migration` VARCHAR(255) NOT NULL UNIQUE,
            `batch` INT NOT NULL DEFAULT 1,
            `applied_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $this->pdo->exec($sql);
    }

    /**
     * Get list of already applied migrations
     */
    public function getAppliedMigrations() {
        $this->ensureMigrationTable();
        try {
            $stmt = $this->pdo->query("SELECT `migration` FROM `migrations` ORDER BY `id` ASC");
            return $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get current batch number
     */
    public function getNextBatchNumber() {
        $this->ensureMigrationTable();
        try {
            $stmt = $this->pdo->query("SELECT MAX(`batch`) FROM `migrations`");
            $max = $stmt ? (int)$stmt->fetchColumn() : 0;
            return $max + 1;
        } catch (Exception $e) {
            return 1;
        }
    }

    /**
     * Discover all available migration files
     */
    public function getAvailableMigrations() {
        if (!is_dir($this->migrationsDir)) {
            return [];
        }
        $files = scandir($this->migrationsDir);
        $migrations = [];
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            if (preg_match('/^\d+.*?\.(sql|php)$/i', $file)) {
                $migrations[] = $file;
            }
        }
        sort($migrations, SORT_STRING);
        return $migrations;
    }

    /**
     * Get migration status
     */
    public function getStatus() {
        $applied = $this->getAppliedMigrations();
        $available = $this->getAvailableMigrations();
        $status = [];
        
        foreach ($available as $migration) {
            $status[] = [
                'migration' => $migration,
                'applied' => in_array($migration, $applied, true),
            ];
        }
        return $status;
    }

    /**
     * Run all pending migrations
     */
    public function runPending() {
        $this->ensureMigrationTable();
        $applied = $this->getAppliedMigrations();
        $available = $this->getAvailableMigrations();
        $pending = array_diff($available, $applied);

        if (empty($pending)) {
            return [
                'success' => true,
                'message' => 'දත්ත සමුදාය දැනටමත් යාවත්කාලීනයි (All migrations are already up to date).',
                'applied' => [],
                'skipped' => $applied,
                'errors' => []
            ];
        }

        $batch = $this->getNextBatchNumber();
        $appliedNow = [];
        $errors = [];

        foreach ($pending as $migrationFile) {
            $filePath = $this->migrationsDir . DIRECTORY_SEPARATOR . $migrationFile;
            try {
                if (str_ends_with(strtolower($migrationFile), '.sql')) {
                    $this->executeSqlFile($filePath);
                } elseif (str_ends_with(strtolower($migrationFile), '.php')) {
                    $this->executePhpFile($filePath);
                }

                // Record successful migration
                $stmt = $this->pdo->prepare("INSERT INTO `migrations` (`migration`, `batch`, `applied_at`) VALUES (:migration, :batch, NOW())");
                $stmt->execute([
                    ':migration' => $migrationFile,
                    ':batch' => $batch
                ]);

                $appliedNow[] = $migrationFile;
            } catch (Exception $e) {
                $errors[] = [
                    'migration' => $migrationFile,
                    'error' => $e->getMessage()
                ];
                error_log("Migration failed [{$migrationFile}]: " . $e->getMessage());
                // Halt on first failure to preserve consistency
                break;
            }
        }

        return [
            'success' => empty($errors),
            'batch' => $batch,
            'applied' => $appliedNow,
            'errors' => $errors
        ];
    }

    /**
     * Safely execute an SQL migration file statement by statement
     */
    private function executeSqlFile($filePath) {
        $content = file_get_contents($filePath);
        if ($content === false) {
            throw new RuntimeException("Cannot read migration file: {$filePath}");
        }

        // Strip comments and split by semicolon (respecting single/double quotes)
        $queries = $this->splitSqlQueries($content);

        foreach ($queries as $query) {
            $trimmed = trim($query);
            if (empty($trimmed)) continue;

            try {
                $this->pdo->exec($trimmed);
            } catch (PDOException $e) {
                // If error is duplicate column, duplicate key, or table already exists, allow idempotent pass-through
                $msg = strtolower($e->getMessage());
                $code = $e->getCode();
                if (
                    str_contains($msg, 'already exists') ||
                    str_contains($msg, 'duplicate column') ||
                    str_contains($msg, 'duplicate key') ||
                    str_contains($msg, 'duplicate entry') ||
                    $code == 1060 || // ER_DUP_FIELDNAME
                    $code == 1061 || // ER_DUP_KEYNAME
                    $code == 1050    // ER_TABLE_EXISTS_ERROR
                ) {
                    continue;
                }
                throw $e;
            }
        }
    }

    /**
     * Execute a PHP migration file
     */
    private function executePhpFile($filePath) {
        $pdo = $this->pdo;
        require $filePath;
    }

    /**
     * Split SQL into separate statements safely
     */
    private function splitSqlQueries($sql) {
        $queries = [];
        $length = strlen($sql);
        $current = '';
        $inSingleQuote = false;
        $inDoubleQuote = false;
        $inBacktick = false;

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $prev = $i > 0 ? $sql[$i - 1] : '';

            // Handle strings & backticks
            if ($char === "'" && $prev !== '\\' && !$inDoubleQuote && !$inBacktick) {
                $inSingleQuote = !$inSingleQuote;
            } elseif ($char === '"' && $prev !== '\\' && !$inSingleQuote && !$inBacktick) {
                $inDoubleQuote = !$inDoubleQuote;
            } elseif ($char === '`' && !$inSingleQuote && !$inDoubleQuote) {
                $inBacktick = !$inBacktick;
            }

            // Single line comment -- or #
            if (!$inSingleQuote && !$inDoubleQuote && !$inBacktick) {
                if (($char === '-' && ($i + 1 < $length) && $sql[$i + 1] === '-') || $char === '#') {
                    // Skip till newline
                    $newlinePos = strpos($sql, "\n", $i);
                    if ($newlinePos === false) {
                        break;
                    }
                    $i = $newlinePos;
                    continue;
                }
            }

            // End of query delimiter
            if ($char === ';' && !$inSingleQuote && !$inDoubleQuote && !$inBacktick) {
                $trimmed = trim($current);
                if (!empty($trimmed)) {
                    $queries[] = $trimmed;
                }
                $current = '';
                continue;
            }

            $current .= $char;
        }

        $trimmed = trim($current);
        if (!empty($trimmed)) {
            $queries[] = $trimmed;
        }

        return $queries;
    }
}
