import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dfg from './Components/Dfg'
import HomePage from './Components/HomePage';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dfg" element={<Dfg />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
