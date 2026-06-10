import { Request, Response } from 'express';
import { expensesService } from './expenses.service.js';

export const expensesController = {
  async getExpenses(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const user = (req as any).user;
      const data = await expensesService.getExpenses(
        date as string | undefined,
        user.role,
        user.id
      );
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  async createExpense(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const expense = await expensesService.createExpense(user.id, req.body);
      res.status(201).json(expense);
    } catch (err: any) {
      console.error('[expenses] createExpense error:', err.message);
      res.status(400).json({ message: err.message });
    }
  },

  async updateExpense(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const expense = await expensesService.updateExpense(
        req.params.id,
        user.id,
        user.role,
        req.body
      );
      res.json(expense);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteExpense(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const result = await expensesService.deleteExpense(
        req.params.id,
        user.id,
        user.role
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};

