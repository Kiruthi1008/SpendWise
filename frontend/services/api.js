
const TOKEN_KEY = 'spendwise_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

function queryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const result = query.toString();
  return result ? `?${result}` : '';
}

export const api = {
  // Authentication
  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request('/api/auth/me'),

  updateProfile: (payload) =>
    request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  checkUsername: (username) =>
    request(`/api/auth/check-username/${encodeURIComponent(username)}`),

  // Expenses
  getExpenses: (params = {}) =>
    request(`/api/expenses${queryString({
      category: params.category,
      search: params.search,
      month: params.month,
      year: params.year,
      startDate: params.startDate,
      endDate: params.endDate,
    })}`),

  getExpenseCategories: () =>
    request('/api/expenses/categories'),

  addExpenseCategory: (name, icon = 'Tag', color = '#0284c7') =>
    request('/api/expenses/categories', {
      method: 'POST',
      body: JSON.stringify({ name, icon, color }),
    }),

  createExpense: (payload) =>
    request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExpense: (id, payload) =>
    request(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteExpense: (id) =>
    request(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Incomes
  getIncomes: (params = {}) =>
    request(`/api/incomes${queryString({
      source: params.source,
      search: params.search,
      month: params.month,
      year: params.year,
      startDate: params.startDate,
      endDate: params.endDate,
    })}`),

  getIncomeSources: () =>
    request('/api/incomes/sources'),

  addIncomeSource: (name, icon = 'Coins', color = '#0284c7') =>
    request('/api/incomes/sources', {
      method: 'POST',
      body: JSON.stringify({ name, icon, color }),
    }),

  createIncome: (payload) =>
    request('/api/incomes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateIncome: (id, payload) =>
    request(`/api/incomes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteIncome: (id) =>
    request(`/api/incomes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Dashboard
  getDashboardStats: (params = {}) =>

    request(`/api/dashboard/stats${queryString({
      month: params.month,
      year: params.year,
    })}`),

  // Savings, budgets, and insights
  getSavingsOverview: (month) =>
    request(`/api/savings/overview${queryString({ month })}`),

  setMonthlyBudget: (month, amount) =>
    request('/api/savings/budget', {
      method: 'PUT',
      body: JSON.stringify({ month, amount }),
    }),

  createSavingsGoal: (payload) =>
    request('/api/savings/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSavingsGoal: (id, payload) =>
    request(`/api/savings/goals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteSavingsGoal: (id) =>
    request(`/api/savings/goals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  addSavingsTransaction: (id, payload) =>
    request(
      `/api/savings/goals/${encodeURIComponent(id)}/transactions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Recurring transactions
  getRecurringTransactions: () =>
    request('/api/recurring'),

  createRecurringTransaction: (payload) =>
    request('/api/recurring', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setRecurringTransactionStatus: (id, status) =>
    request(`/api/recurring/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteRecurringTransaction: (id) =>
    request(`/api/recurring/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Bills and subscriptions
  getBills: () => request('/api/bills'),

  createBill: (payload) =>
    request('/api/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBill: (id, payload) =>
    request(`/api/bills/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  payBill: (id, paid_date) =>
    request(`/api/bills/${encodeURIComponent(id)}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paid_date }),
    }),

  cancelBill: (id) =>
    request(`/api/bills/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
    }),

  deleteBill: (id) =>
    request(`/api/bills/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // To-Dos and deadlines
  getTodos: () => request('/api/todos'),

  createTodo: (payload) =>
    request('/api/todos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTodo: (id, payload) =>
    request(`/api/todos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleTodo: (id) =>
    request(`/api/todos/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
    }),

  deleteTodo: (id) =>
    request(`/api/todos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
