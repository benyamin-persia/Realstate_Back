import { useRouteError, useNavigate } from "react-router-dom";
import "./profilePage.scss";

function ProfileError() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="error-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '20px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h2>Oops! Something went wrong</h2>
      <p style={{ color: '#666' }}>{error.message}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => navigate("/")}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fece51',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Home
        </button>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fece51',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default ProfileError; 