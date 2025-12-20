import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dfg from './Components/Dfg'
import HomePage from './Components/HomePage';
import ShowCostToAddEdgesDetails from './Components/ShowCostToAddEdgesDetails';
import ShowMissingEdgeCostDetails from './Components/ShowMissingEdgeCostDetails';
import AllPossibleOcpts from './Components/AllPossibleOcpts';
import UploadFile from './Components/UploadFile';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<UploadFile />} />
                    <Route path="/file/:name" element={<HomePage />} />
                    <Route path="/file/dfg/:name" element={<Dfg />} />
                    <Route path="/file/add-edges" element={<ShowCostToAddEdgesDetails />} />
                    <Route path="/file/add-edges/:id" element={<ShowCostToAddEdgesDetails />} />
                    <Route path="/file/missing-edge-cost/:id" element={<ShowMissingEdgeCostDetails />} />
                    <Route path="/file/:name/all-possible-ocpts" element={<AllPossibleOcpts />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
