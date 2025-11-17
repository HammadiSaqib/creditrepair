import express from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../database/mysqlConfig.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { SecurityLogger } from '../utils/securityLogger.js';

const router = express.Router();
const securityLogger = new SecurityLogger();

// Ensure only admins can manage their employees
const requireAdminRole = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    securityLogger.logSecurityEvent('unauthorized_employee_access', {
      userId: req.user?.id,
      userRole: req.user?.role,
      endpoint: req.originalUrl,
      ip: req.ip
    });
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// GET /api/employees - List employees for current admin
router.get('/', authenticateToken, requireAdminRole, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const rows = await executeQuery(
      `SELECT 
         e.id AS employee_id,
         e.status AS employee_status,
         e.created_at AS employee_created_at,
         e.updated_at AS employee_updated_at,
         u.id AS user_id,
         u.email,
         u.first_name,
         u.last_name,
         u.role,
         u.status AS user_status,
         u.last_login,
         u.created_at,
         u.updated_at
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE e.admin_id = ?
       ORDER BY e.created_at DESC`,
      [adminId]
    );

    const data = rows.map((row: any) => ({
      id: row.employee_id,
      status: row.employee_status,
      createdAt: row.employee_created_at,
      updatedAt: row.employee_updated_at,
      user: {
        id: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        status: row.user_status,
        lastLogin: row.last_login,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error listing employees:', error);
    securityLogger.logSecurityEvent('employee_list_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to list employees' });
  }
});

// GET /api/employees/:id - Get an employee by id (must belong to current admin)
router.get('/:id', authenticateToken, requireAdminRole, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const employeeId = Number(req.params.id);
    const rows = await executeQuery(
      `SELECT 
         e.id AS employee_id,
         e.status AS employee_status,
         e.admin_id,
         e.created_at AS employee_created_at,
         e.updated_at AS employee_updated_at,
         u.id AS user_id,
         u.email,
         u.first_name,
         u.last_name,
         u.role,
         u.status AS user_status
       FROM employees e
       JOIN users u ON u.id = e.user_id
       WHERE e.id = ? AND e.admin_id = ?
       LIMIT 1`,
      [employeeId, adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const row = rows[0];
    const data = {
      id: row.employee_id,
      status: row.employee_status,
      createdAt: row.employee_created_at,
      updatedAt: row.employee_updated_at,
      user: {
        id: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        status: row.user_status,
      }
    };

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    securityLogger.logSecurityEvent('employee_get_error', {
      userId: req.user?.id,
      employeeId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employees - Create a new employee under the current admin
router.post('/', authenticateToken, requireAdminRole, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const { email, firstName, lastName, role, status, password } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields: email, firstName, lastName' });
    }

    // Validate role (default to 'user' or allow 'funding_manager')
    const userRole = role === 'funding_manager' ? 'funding_manager' : 'user';

    // Check if user with email already exists
    const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const tempPassword = password || (Math.random().toString(36).slice(-8) + 'A1!');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Insert new user for employee (use columns present in current schema)
    const insertUserSql = `
      INSERT INTO users (
        email, password_hash, first_name, last_name,
        role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const userResult = await executeQuery(insertUserSql, [
      email,
      passwordHash,
      firstName,
      lastName,
      userRole,
      status || 'active'
    ]);

    const newUserId = userResult.insertId;

    // Link user as employee to the current admin
    const insertEmployeeSql = `
      INSERT INTO employees (admin_id, user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const employeeResult = await executeQuery(insertEmployeeSql, [
      adminId,
      newUserId,
      status || 'active'
    ]);

    securityLogger.logSecurityEvent('employee_created', {
      adminId,
      employeeId: employeeResult.insertId,
      userId: newUserId,
      email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        id: employeeResult.insertId,
        status: status || 'active',
        user: {
          id: newUserId,
          email,
          firstName,
          lastName,
          role: userRole,
          status: status || 'active'
        },
        tempPassword // provide so admin can share with employee
      }
    });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    securityLogger.logSecurityEvent('employee_creation_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id - Update employee (and linked user) details
router.put('/:id', authenticateToken, requireAdminRole, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const employeeId = Number(req.params.id);
    const { firstName, lastName, role, status } = req.body;

    // Verify employee belongs to admin
    const employeeRows = await executeQuery(
      'SELECT user_id FROM employees WHERE id = ? AND admin_id = ?',
      [employeeId, adminId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const userId = employeeRows[0].user_id;

    // Update user
    if (firstName || lastName || role || status) {
      const updates: string[] = [];
      const params: any[] = [];
      if (firstName !== undefined) { updates.push('first_name = ?'); params.push(firstName); }
      if (lastName !== undefined) { updates.push('last_name = ?'); params.push(lastName); }
      if (role !== undefined) {
        const userRole = role === 'funding_manager' ? 'funding_manager' : 'user';
        updates.push('role = ?'); params.push(userRole);
      }
      if (status !== undefined) { updates.push('status = ?'); params.push(status); }
      if (updates.length > 0) {
        const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        params.push(userId);
        await executeQuery(sql, params);
      }
    }

    // Update employee status if provided
    if (status !== undefined) {
      await executeQuery(
        'UPDATE employees SET status = ?, updated_at = NOW() WHERE id = ? AND admin_id = ?',
        [status, employeeId, adminId]
      );
    }

    securityLogger.logSecurityEvent('employee_updated', {
      adminId,
      employeeId,
      userId,
      changes: { firstName, lastName, role, status },
      ip: req.ip
    });

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    securityLogger.logSecurityEvent('employee_update_error', {
      userId: req.user?.id,
      employeeId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id - Deactivate employee user (soft delete)
router.delete('/:id', authenticateToken, requireAdminRole, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const employeeId = Number(req.params.id);

    const employeeRows = await executeQuery(
      'SELECT user_id FROM employees WHERE id = ? AND admin_id = ?',
      [employeeId, adminId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const userId = employeeRows[0].user_id;

    // Soft delete: set user inactive and employee inactive
    await executeQuery('UPDATE users SET status = "inactive", updated_at = NOW() WHERE id = ?', [userId]);
    await executeQuery('UPDATE employees SET status = "inactive", updated_at = NOW() WHERE id = ? AND admin_id = ?', [employeeId, adminId]);

    securityLogger.logSecurityEvent('employee_deactivated', {
      adminId,
      employeeId,
      userId,
      ip: req.ip
    });

    res.json({ success: true, message: 'Employee deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating employee:', error);
    securityLogger.logSecurityEvent('employee_deactivation_error', {
      userId: req.user?.id,
      employeeId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

// POST /api/employees/:id/toggle-status - Toggle employee status
router.post('/:id/toggle-status', authenticateToken, requireAdminRole, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const employeeId = Number(req.params.id);

    const employeeRows = await executeQuery(
      `SELECT e.id, e.status AS employee_status, u.id AS user_id, u.email, u.status AS user_status
       FROM employees e JOIN users u ON u.id = e.user_id
       WHERE e.id = ? AND e.admin_id = ?`,
      [employeeId, adminId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { user_id, user_status, employee_status } = employeeRows[0];
    const newUserStatus = user_status === 'active' ? 'inactive' : 'active';
    const newEmployeeStatus = employee_status === 'active' ? 'inactive' : 'active';

    await executeQuery('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [newUserStatus, user_id]);
    await executeQuery('UPDATE employees SET status = ?, updated_at = NOW() WHERE id = ? AND admin_id = ?', [newEmployeeStatus, employeeId, adminId]);

    securityLogger.logSecurityEvent('employee_status_toggled', {
      adminId,
      employeeId,
      userId: user_id,
      oldUserStatus: user_status,
      newUserStatus,
      oldEmployeeStatus: employee_status,
      newEmployeeStatus,
      ip: req.ip
    });

    res.json({ success: true, message: `Employee ${newEmployeeStatus === 'active' ? 'activated' : 'deactivated'} successfully`, newStatus: newEmployeeStatus });
  } catch (error: any) {
    console.error('Error toggling employee status:', error);
    securityLogger.logSecurityEvent('employee_status_toggle_error', {
      userId: req.user?.id,
      employeeId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to toggle employee status' });
  }
});

export default router;