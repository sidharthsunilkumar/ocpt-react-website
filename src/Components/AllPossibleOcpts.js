import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './AllPossibleOcpts.css';

export default function AllPossibleOcpts() {
    const [ocptData, setOcptData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOcptData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:1080/all-possible-ocpts');
                console.log('All Possible OCPTs Data:', response.data);
                setOcptData(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching all possible OCPTs:', err);
                setError(err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchOcptData();
    }, []);

    if (loading) {
        return (
            <div className="all-possible-ocpts-container">
                <h2>All Possible OCPTs</h2>
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="all-possible-ocpts-container">
                <h2>All Possible OCPTs</h2>
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="all-possible-ocpts-container">
            <h2>All Possible OCPTs</h2>
            <div className="ocpt-data">
                {ocptData ? (
                    <pre className="json-display">
                        {JSON.stringify(ocptData, null, 2)}
                    </pre>
                ) : (
                    <div>No data available</div>
                )}
            </div>
        </div>
    );
}
