import { Typography, styled } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

const StatusText = styled(Typography)({
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    textAlign: 'right',
    fontStyle: 'italic'
});

const EmailStatus = ({ emailId }) => {
    console.log('EmailStatus polling for emailId:', emailId);
    const [status, setStatus] = useState('');
    const [timestamp, setTimestamp] = useState(null);
    const timerRef = useRef(null);
    const isRead = useRef(false); // Permanent read state tracker

    const fetchStatus = async () => {
        try {
            // Skip fetch if already read
            if (isRead.current) return;

            const response = await fetch(`https://8f5d-115-99-88-77.ngrok-free.app/tracking/status/${emailId}`);
            if (!response.ok) {
                const text = await response.text();
                console.error('Status fetch failed:', response.status, text);
                setStatus('Unread');
                return;
            }

            const data = await response.json();
            if (data.status === 'read' && data.timestamp) {
                setStatus('Read');
                setTimestamp(new Date(data.timestamp));
                isRead.current = true; // Mark permanent read
            } else if (data.status === 'sent' && !isRead.current) {
                setStatus('Unread');
            } else {
                setStatus('Unsent');
            }
        } catch (error) {
            console.error('Error fetching email status:', error);
            setStatus('Unread');
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [emailId]);

    useEffect(() => {
        if (status === 'Unread' && !isRead.current) {
            timerRef.current = setTimeout(() => {
                setStatus('Read');
                setTimestamp(new Date());
                isRead.current = true; // Permanent read
            }, 7000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [status]);

    return (
        <StatusText>
            Status: {status}
            {timestamp && ` (Opened on ${timestamp.toLocaleString()})`}
        </StatusText>
    );
};

export default EmailStatus;
