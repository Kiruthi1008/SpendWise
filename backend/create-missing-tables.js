
import pool from './db-mysql.js';

async function main() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_month_budget (user_id, month, year),
        CONSTRAINT fk_monthly_budgets_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(80) NOT NULL,
        target_amount DECIMAL(12,2) NOT NULL,
        balance DECIMAL(12,2) NOT NULL DEFAULT 0,
        deadline DATE NULL,
        archived TINYINT(1) NOT NULL DEFAULT 0,
        note VARCHAR(240) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_savings_goals_user (user_id),
        CONSTRAINT fk_savings_goals_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        goal_id VARCHAR(36) NOT NULL,
        goal_title VARCHAR(80) NOT NULL,
        type ENUM('contribution', 'withdrawal') NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        note VARCHAR(240) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_savings_transactions_user (user_id),
        KEY idx_savings_transactions_goal (goal_id),
        CONSTRAINT fk_savings_transactions_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_savings_transactions_goal
          FOREIGN KEY (goal_id) REFERENCES savings_goals(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

main()
  .catch((error) => {
    console.error('Table creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
