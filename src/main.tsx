import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/antd.min.css'; 
ReactDOM.createRoot(
  (() => {
    const app = document.createElement('div');
    document.body.append(app);
    return app;
  })(),
).render(
    <App />
);
