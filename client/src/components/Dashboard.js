import React, { useEffect, useState, useRef } from 'react';
import { fetchExpenses, fetchBudgets } from '../services/api';
import ExpenseCategoryChart from './visualization/ExpenseCategoryChartDashboard';
import ProgressBar from './ProgressBar';
import Navbar from './Navbar';
import axios from 'axios';
import { FaSpinner, FaChartPie } from 'react-icons/fa';
import { MdDateRange } from 'react-icons/md';
import { FaBarsProgress } from 'react-icons/fa6';
import { GiTakeMyMoney } from "react-icons/gi";
import { BiBox } from "react-icons/bi";
import { TiThList } from 'react-icons/ti';
import { Link } from 'react-router-dom';
import ExpenseForm from './expenses/ExpenseForm';
import Modal from './Modal/Modal';

const Dashboard = () => {
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProgressBarModalVisible, setIsProgressBarModalVisible] = useState(false);
  const [progressBarCategory, setProgressBarCategory] = useState('');
  const [isAddExpenseFormVisible, setIsAddExpenseFormVisible] = useState(false);
  const [theme, setTheme] = useState('light');



  useEffect(() => {
    const getData = async () => {
      try {
        const expensesData = await fetchExpenses();
        const budgetsData = await fetchBudgets();
        setExpenses(expensesData);
        setBudgets(budgetsData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    getData();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/profile', {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        });
        setName(response.data.name);
        setProfilePicture(response.data.profilePicture || '');
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);
  const handleSaveExpense = async (expense) => {
    try {
      if (expense._id) {
        await axios.put(`/api/expenses/${expense._id}`, expense, {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        });
      } else {
        await axios.post('/api/expenses', expense, {
          headers: {
            'x-auth-token': localStorage.getItem('token'),
          },
        });
      }
      const expensesData = await fetchExpenses(); // Refresh expenses after save/update
      setExpenses(expensesData);
      setIsModalVisible(false); // Close the modal after saving/updating
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleAddExpense = () => {
    setIsModalVisible(true); // Show the modal for adding expense
    setExpenseToEdit(null); // Clear any existing edit state
  };

  const clearEdit = () => {
    setExpenseToEdit(null);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setExpenseToEdit(null);
  };
  
  const handleProgressBarModalOpen = (category) => {
    setProgressBarCategory(category);
    setIsProgressBarModalVisible(true);
    setIsAddExpenseFormVisible(false);
  };

  const handleAddExpenseFormOpen = () => {
    setIsAddExpenseFormVisible(true);
  };
  
  
  const handleProgressBarModalClose = () => {
    setIsProgressBarModalVisible(false);
    setProgressBarCategory('');
  };
  const modalRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleProgressBarModalClose();
    }
  };

  if (isProgressBarModalVisible) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isProgressBarModalVisible]);

useEffect(() => {
  // Get the stored theme from localStorage
  const storedTheme = localStorage.getItem('theme') || 'light';
  setTheme(storedTheme);
  document.documentElement.setAttribute('data-theme', storedTheme);
}, []);


  


  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
  }, []);

  // Create a mapping of budget IDs to categories
  const budgetCategoryMap = budgets.reduce((map, budget) => {
    map[budget._id] = budget.category;
    return map;
  }, {});

  // Calculate total expenses for each category based on budget IDs
  const categoryExpenseMap = expenses.reduce((acc, expense) => {
    const category = budgetCategoryMap[expense.budget];
    if (category) {
      acc[category] = (acc[category] || 0) + expense.amount;
    }
    return acc;
  }, {});

  // Function to get total expenses for a specific category
  const calculateTotalExpenses = (category) => {
    return categoryExpenseMap[category] || 0;
  };

  // Map to store colors for each category
  const categoryColors = {};

  const getCategoryColor = (category) => {
    if (!categoryColors[category]) {
      categoryColors[category] = getRandomLightColor();
    }
    return categoryColors[category];
  };

  const getRandomLightColor = () => {
    const r = Math.floor(Math.random() * 56) + 200;
    const g = Math.floor(Math.random() * 56) + 200;
    const b = Math.floor(Math.random() * 56) + 200;
    return `rgb(${r}, ${g}, ${b})`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-gray-600 mb-4" />
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto py-4 px-4 max-w-screen-lg mt-24 mb-20 flex-1">
        <div className="flex items-center mb-6">
          {profilePicture && (
            <img
              src={profilePicture.startsWith('http') ? profilePicture : `${window.location.origin}${profilePicture}`}
              alt="Profile"
              className="w-16 h-16 rounded-full mr-4 border-2 border-gray-300 transition-all duration-500 ease-in-out transform hover:scale-110"
            />
          )}
          <h1 className="text-3xl font-bold animate-fadeIn text-emerald-400">{`Welcome, ${name}!`}</h1>
        </div>
        {expenses.length > 0 ? (
          <div className="flex flex-col md:flex-row mb-10 w-full">
            <div className="md:w-1/2 pr-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold flex items-center">
                  <TiThList className="mr-2 text-blue-500" />
                  Latest Expenses
                </h2>
                <button
                  onClick={handleAddExpense}
                  className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                >
                  Add Expense
                </button>
              </div>
              <div className="flex flex-col items-center">
                {expenses.length > 0 ? (
                  expenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((expense) => (
                      <div
                        key={expense._id}
                        className={`w-full max-w-lg rounded-lg shadow-md p-4 mb-4 transition-all duration-500 ease-in-out transform hover:scale-105 text-gray-800 font-bold ${
                          expense.budget === null ? 'bg-red-200' : ''
                        }`}
                        style={{
                          backgroundColor: expense.budget !== null ? getCategoryColor(budgetCategoryMap[expense.budget]) : undefined,
                        }}
                      >
                        <p className="text-lg flex items-center">
                          {/* Conditionally render icon based on description */}
                          {expense.description ? <BiBox  className="mr-2" /> : null}
                          {expense.description || ''}
                        </p>
                        <p className="text-md flex items-center">
                          <GiTakeMyMoney className="mr-2" />
                          Amount: RS. {expense.amount}
                        </p>
                        <p className="text-sm flex items-center">
                          <MdDateRange className="mr-2" />
                          Date: {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-center dark:text-gray-400">No recent expenses. Please add some expenses to see them here.</p>
                )}
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <FaChartPie className="mr-2 text-purple-500" />
                Expenses by Category
              </h2>
              {expenses.length > 0 ? (
                <div className="shadow-lg rounded-lg overflow-hidden transition-transform transform-gpu hover:scale-105">
                  <ExpenseCategoryChart />
                </div>
              ) : (
                <p className="text-gray-500 text-center dark:text-gray-400">No expenses data available for chart. Please add some expenses to see the chart here.</p>
              )}
            </div>
          </div>
        ) : (
          <>
          <div className="flex flex-col items-center mb-6 space-y-4">
            <p className="text-gray-500 text-center dark:text-gray-400 mb-2">
              No expenses available. Please add some expenses.
            </p>
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition duration-300"
            >
              Add Expense
            </button>
          </div>
          </>
        )}
        {budgets.length > 0 ? (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FaBarsProgress className="mr-2 text-green-500" />
              Budget Progress
            </h2>
            <div className="flex flex-col">
              {budgets.map((budget) => {
                const totalExpenses = calculateTotalExpenses(budget.category);
                return (
                  <ProgressBar
                    key={budget._id}
                    category={budget.category}
                    total={budget.limit}
                    current={totalExpenses}
                    onClick={() => handleProgressBarModalOpen(budget.category)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center dark:text-gray-400">
            No budgets available. Please add some budgets to track your expenses.<br /><br />
            <Link 
              to="/budgets" 
              className="inline-block px-4 py-2 text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Set your budget here.
            </Link>
          </p>
        )}
      </div>

      <Modal isVisible={isModalVisible} onClose={handleCloseModal}>
        <ExpenseForm
          onSave={handleSaveExpense}
          expenseToEdit={expenseToEdit}
          clearEdit={clearEdit}
          onClose={handleCloseModal}
        />
      </Modal>

      {/* Modal to display expenses for the selected category */}
      {isProgressBarModalVisible && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-70`}>
          <div
            className={`${
              theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-100'
            } rounded-lg shadow-lg p-6 max-w-md w-full relative`}
            ref={modalRef}
          >
            <h3 className="text-xl font-semibold mb-4">
              {progressBarCategory} Expenses
            </h3>
            <button
              onClick={handleProgressBarModalClose}
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              &times;
            </button>
            <button
              onClick={handleAddExpenseFormOpen}
              className={`px-4 py-2 rounded shadow ${
                theme === 'light' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-700 text-white hover:bg-blue-800'
              } mb-4`}
            >
              Add Expense
            </button>
            
            {/* Scrollable container */}
            <div className="max-h-72 overflow-y-auto mb-4">
              <ul className="space-y-3">
                {expenses
                  .filter((expense) => budgetCategoryMap[expense.budget] === progressBarCategory)
                  .map((expense) => (
                    <li key={expense._id} className="border-b pb-2">
                      <p className="font-semibold">
                        <span className="mr-2">•</span>
                        {new Date(expense.date).toLocaleDateString('en-CA')}
                      </p>
                      <p>RS. {expense.amount}</p>
                      <p>{expense.description}</p> 
                    </li>
                  ))}
                {expenses.every((expense) => budgetCategoryMap[expense.budget] !== progressBarCategory) && (
                  <p className="text-gray-500 dark:text-gray-400">No expenses found for this category.</p>
                )}
              </ul>
            </div>

            {isAddExpenseFormVisible && (
              <ExpenseForm
                onSave={async (expense) => {
                  await handleSaveExpense({ ...expense, budget: budgetCategoryMap[progressBarCategory] });
                  handleProgressBarModalClose(); // Close the modal after saving
                }}
                expenseToEdit={null} // Start with a new expense
                clearEdit={() => {}}
                onClose={() => setIsAddExpenseFormVisible(false)}
              />
            )}
          </div>
        </div>
      )}

     
    </div>
  );
};

export default Dashboard;
