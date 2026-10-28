import { Navigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';

const ProtectedRoute = ({ children }) => {
    const { connectedPlayer } = usePlayer();
    const location = useLocation();
    if (!connectedPlayer) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
};

export default ProtectedRoute;
