import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomePage.css';
import DirectedGraph from './DirectedGraph';
import DirectedGraphV2 from './DirectedGraphV2';
import DirectedGraphV2example from './DirectedGraphV2example';
import DirectedGraphV2simpleexample from './DirectedGraphV2simpleexample';
import DirectedGraphV2clusterexample from './DirectedGraphV2clusterexample';
import CutSuggestion from './CutSuggestion';
import TreeView from './TreeView';
// import { useNavigate, Link } from 'react-router-dom';

export default function HomePage() {

    const [isLoading, setIsLoading] = useState(true);
    const [dfg, setDfg] = useState({ nodes: [], edges: [] });
    const [startActivities, setStartActivities] = useState([]);
    const [endActivities, setEndActivities] = useState([]);
    const [isPerfectlyCut, setIsPerfectlyCut] = useState(true);
    const [cutSuggestionsList, setCutSuggestionsList] = useState([]);
    const [ocpt, setOcpt] = useState([]);

    useEffect(() => {
        console.log("Fetching graph data from server...");
        axios.get('http://localhost:1080/')
            .then(response => {
                console.log(response.data);
                const nodesArray = Object.values(response.data.dfg.nodes || []);
                const edgesArray = Object.values(response.data.dfg.edges || []);
                setDfg({ nodes: nodesArray, edges: edgesArray });
                setStartActivities(response.data.start_activities || []);
                setEndActivities(response.data.end_activities || []);
                setCutSuggestionsList(response.data.cut_suggestions_list || []);
                setOcpt(response.data.OCPT || []);
                setIsPerfectlyCut(response.data.is_perfectly_cut || true);
            })
            .catch(err => {
                console.error("Error fetching graph data:", err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    // Function to handle cut selection and send POST request
    const handleCutSelected = (cutSelected) => {
        console.log("Cut selected:", cutSelected);
        axios.post('http://localhost:1080/cut-selected', {
            dfg,
            ocpt,
            start_activities: startActivities,
            end_activities: endActivities,
            is_perfectly_cut: isPerfectlyCut,
            cut_suggestions_list: cutSuggestionsList,
            cut_selected: cutSelected
        })
        .then(res => {
            console.log('Cut selected POST response:', res.data);
            const response = res.data;
            const nodesArray = Object.values(response.dfg.nodes || []);
            const edgesArray = Object.values(response.dfg.edges || []);
            setDfg({ nodes: nodesArray, edges: edgesArray });
            setStartActivities(response.start_activities || []);
            setEndActivities(response.end_activities || []);
            setCutSuggestionsList(response.cut_suggestions_list || []);
            setOcpt(response.OCPT || []);
            setIsPerfectlyCut(response.is_perfectly_cut || true);
        })
        .catch(err => {
            console.error('Error posting cut selection:', err);
        });
    };

    return (
        <div>
            <div className='home-page-wrapper'>
                {isLoading ? <div>Loading...</div> :
                    <div>
                        <TreeView data={ocpt} />
                        <div className='cut-suggestions-wrapper'>
                            {cutSuggestionsList.cuts.map((cutSuggestion, index) => (
                                <CutSuggestion
                                    cutSuggestion={cutSuggestion}
                                    dfg={dfg}
                                    key={index}
                                    handleCutSelected={handleCutSelected}
                                />
                            ))}
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}