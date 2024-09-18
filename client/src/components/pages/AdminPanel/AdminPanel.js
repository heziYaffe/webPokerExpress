import React from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const AdminPanel = () => {

    // פונקציה שמוחקת את כל החדרים דרך ה-API
    const deleteAllRooms = async () => {
        try {
            const token = localStorage.getItem('token'); // שים לב מאיפה אתה שומר את הטוקן לאחר התחברות המשתמש
            if (!token) {
                throw new Error("No token found");
            }
            const response = await fetch(`${API_URL}/api/admin/rooms`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // הוספת הטוקן לכותרת Authorization

                }
            });
            const result = await response.json();
            console.log(result.message); // הצגת הודעת המחיקה בקונסול
        } catch (error) {
            console.error('Error deleting rooms:', error);
        }
    };

    const deleteAllUsersExceptAdmin = async () => {
        try {
            const token = localStorage.getItem('token'); // שים לב מאיפה אתה שומר את הטוקן לאחר התחברות המשתמש
            if (!token) {
                throw new Error("No token found");
            }
            const response = await fetch(`${API_URL}/api/admin/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // הוספת הטוקן לכותרת Authorization

                }
            });
            const result = await response.json();
            console.log(result.message); // הצגת הודעת המחיקה בקונסול
        } catch (error) {
            console.error('Error deleting users:', error);
        }
    };

    

    return (
        <div className="admin-panel">
            <h1>Admin Panel</h1>
            {/* כפתור למחיקת כל החדרים */}
            <button onClick={deleteAllRooms}>Delete All Rooms</button>
            <button onClick={deleteAllUsersExceptAdmin}>Delete All users</button>

        </div>
    );
};

export default AdminPanel;
