import { ListItem, Checkbox, Typography, Box, styled } from "@mui/material";
import { StarBorder, Star } from '@mui/icons-material';
import useApi from '../hooks/useApi';
import { API_URLS } from "../services/api.urls";
import { useNavigate } from "react-router-dom";
import { routes } from "../routes/routes";


const Wrapper = styled(ListItem)`
    display: flex; 
    align-items: center;
    padding: 0 0 0 10px;
    width: 100%; 
    box-sizing: border-box; 
    background: #f2f6fc;
    cursor: pointer;
    & > div {
        display: flex;
        width: 100%
    }
    & > div > p {
        font-size: 14px;
    }
    overflow: hidden;   
`;

const Indicator = styled(Typography)`
    font-size: 12px !important;
    background: #ddd;
    color: #222;
    border-radius: 4px;
    margin-right: 6px;
    padding: 0 4px;
`;

const DateText = styled(Typography)({
    marginLeft: 'auto',
    marginRight: 20,
    fontSize: 12,
    color: '#5F6368',
    textAlign: 'right'
})

const Email = ({ email, setStarredEmail, selectedEmails, setSelectedEmails }) => {
    const toggleStarredEmailService = useApi(API_URLS.toggleStarredMails);
    
    const navigate = useNavigate();

    const toggleStarredEmail = () => {
        toggleStarredEmailService.call({ id: email._id, value: !email.starred });
        setStarredEmail(prevState => !prevState);
    }

    const handleChange = () => {
        if (selectedEmails.includes(email._id)) {
            setSelectedEmails(prevState => prevState.filter(id => id !== email._id));
        } else {
            setSelectedEmails(prevState => [...prevState, email._id]);
        }
    }

    // Helper to format date/time like Gmail
    const getDisplayDate = (dateString) => {
        const date = new window.Date(dateString);
        const now = new window.Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        if (isToday) {
            // Show time in IST
            return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        } else {
            // Show date in IST
            return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });
        }
    };

    return (
        <Wrapper>
            <Checkbox 
                size="small" 
                checked={selectedEmails.includes(email._id)}
                onChange={() => handleChange()} 
            />
            { 
                email.starred ? 
                    <Star fontSize="small" style={{ marginRight: 10 }} onClick={() => toggleStarredEmail()} />
                : 
                    <StarBorder fontSize="small" style={{ marginRight: 10 }} onClick={() => toggleStarredEmail()} /> 
            }
            <Box onClick={() => navigate(routes.view.path, { state: { email: email }})}
            style={{
                flex: '1 1 auto',
                overflow: 'hidden',
                display: 'flex', 
                gap: '5px',
                width: '100%',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
            }}
            >
            <Typography style={{ 
                width: 200
            }}>To:{email.to ? email.to.split('@')[0] : "Unknown"}</Typography>
                <Indicator>Inbox</Indicator>
                <Typography 
                    style={{ 
                        width: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >{email.subject} {email.body && '-'} {email.body}</Typography>
                <DateText>
                    {getDisplayDate(email.date)}
                </DateText>
            </Box>
        </Wrapper>
    )
}

export default Email;