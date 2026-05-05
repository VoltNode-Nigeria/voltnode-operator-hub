import { Navigate } from "react-router-dom";

// Index simply forwards to the operator dashboard.
const Index = () => <Navigate to="/dashboard" replace />;

export default Index;
