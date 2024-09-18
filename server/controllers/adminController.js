const rooms = require('../models/Room'); // בהנחה שחדרים נשמרים במודל או בזיכרון
const User = require('../models/User'); // בהנחה שמשתמשים נשמרים בבסיס הנתונים


// פונקציה שמוחקת את כל החדרים בבסיס הנתונים
const clearAllRooms = async () => {
    try {
        await rooms.deleteMany({}); // מחיקת כל המסמכים (חדרים) באוסף
        console.log("All rooms deleted from the database.");
    } catch (error) {
        console.error('Error deleting rooms:', error);
        throw new Error('Failed to delete all rooms');
    }
};

const deleteAllRooms = async (req, res) => {
    try {
        await clearAllRooms(); // קריאה לפונקציה שמוחקת את כל החדרים
        return res.status(200).json({ message: 'All rooms deleted.' });
    } catch (error) {
        console.error('Error deleting rooms:', error);
        return res.status(500).json({ message: 'Error deleting rooms' });
    }
};


// פונקציה למחיקת כל המשתמשים חוץ מה-admin
const deleteAllUsersExceptAdmin = async (req, res) => {
    try {
        // תנאי למחיקת כל המשתמשים שה-role שלהם הוא לא 'admin'
        await User.deleteMany({ role: { $ne: 'admin' } }); // $ne מציין 'not equal'
        console.log("All users except admin deleted.");
        return res.status(200).json({ message: 'All users except admin deleted.' });
    } catch (error) {
        console.error('Error deleting users:', error);
        return res.status(500).json({ message: 'Error deleting users' });
    }
};


module.exports = {
    deleteAllRooms,
    deleteAllUsersExceptAdmin,
};
