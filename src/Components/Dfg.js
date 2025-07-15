import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dfg.css';
import DirectedGraph from './DirectedGraph';
import DirectedGraphV2 from './DirectedGraphV2';
import DirectedGraphV2example from './DirectedGraphV2example';
import DirectedGraphV2simpleexample from './DirectedGraphV2simpleexample';
import DirectedGraphV2clusterexample from './DirectedGraphV2clusterexample';
// import { useNavigate, Link } from 'react-router-dom';

export default function Dfg() {

    const [name, setName] = useState("");
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

    useEffect(() => {
        axios.get('http://localhost:1080/')
            .then(response => {
                console.log(response.data);
                // Assuming response.data is { nodes: {...}, edges: {...} }
                // But GraphCanvas expects arrays, so convert if needed
                // If nodes and edges are objects, convert to arrays like below:
                const nodesArray = Object.values(response.data.dfg.nodes || {});
                const edgesArray = Object.values(response.data.dfg.edges || {});
                setGraphData({ nodes: nodesArray, edges: edgesArray });
            })
            .catch(err => {
                console.error("Error fetching graph data:", err);
            });
    }, []);

    return (
        <div>
            <h3>Directly-Follows-Graph</h3>
            <br /><br /><br />

            {/* get data from api */}
            {/* <DirectedGraphV2 dfgNodes={graphData.nodes} dfgEdges={graphData.edges}/> */}

            {/* sample data you usually get from api */}
            {/* <DirectedGraphV2example /> */}

            {/* simple data for testing */}
            {/* <DirectedGraphV2simpleexample /> */}


            {/* simple cluster example for testing */}
            <div className="cluster-wrapper">
                <DirectedGraphV2clusterexample/>
            </div>
            {/* <DirectedGraphV2clusterexample/> */}
        </div>
    );
}
