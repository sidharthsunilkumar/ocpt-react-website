import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dfg from './Components/Dfg'
import HomePage from './Components/HomePage';
import ShowCostToAddEdgesDetails from './Components/ShowCostToAddEdgesDetails';
import ShowMissingEdgeCostDetails from './Components/ShowMissingEdgeCostDetails';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dfg" element={<Dfg />} />
                    <Route path="/add-edges" element={<ShowCostToAddEdgesDetails />} />
                    <Route path="/add-edges/:id" element={<ShowCostToAddEdgesDetails />} />
                    <Route path="/missing-edge-cost/:id" element={<ShowMissingEdgeCostDetails />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
