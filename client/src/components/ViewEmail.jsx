import { Box, Typography, styled } from '@mui/material';
import { useOutletContext, useLocation } from 'react-router-dom';
import { emptyProfilePic } from '../constants/constant';
import { ArrowBack, Delete } from '@mui/icons-material';
import SummarizeEmail from './SummarizeEmail';
import { useEffect } from 'react';

const IconWrapper = styled(Box)({
    position: 'relative', 
    zIndex: 10,
    padding: 15,
    marginTop:70, // Center if necessary
});

const Subject = styled(Typography)({
    fontSize: 22,
    margin: '15px 30px 20px 70px',
    display: 'flex'
});

const Indicator = styled(Box)`
    font-size: 12px !important;
    background: #ddd;
    color: #222;
    border-radius: 4px;
    margin-left: 6px;
    padding: 2px 4px;
    align-self: center;
`;

const Image = styled('img')({
    borderRadius: '50%',
    width: 40,
    height: 40,
    margin: '5px 10px 0 10px',
    backgroundColor: '#cccccc'
});

const Container = styled(Box)({
    marginLeft: 15,
    width: '100%',
    padding: '20px 60px 40px 20px',
    overflow: 'hidden', // Prevent horizontal overflow
    '& > div': {
        display: 'flex',
        flexWrap: 'wrap', // Ensure child elements wrap
        '& > p > span': {
            fontSize: 12,
            color: '#5E5E5E'
        }
    }
});

const Date = styled(Typography)({
    margin: '0 50px 0 auto',
    fontSize: 12,
    color: '#5E5E5E'
});

const BodyText = styled(Typography)({
    whiteSpace: 'pre-wrap',
    marginTop: 20,
    wordBreak: 'break-word', // Ensure long words break properly
    overflowWrap: 'break-word' // Ensure overflowed content wraps
});

const ViewEmail = () => {
    const { openDrawer } = useOutletContext();
    const { state } = useLocation();
    const { email } = state;


    function parseFromField(email) {
        // Check if email.from exists
        if (email.from) {
          // Use a regular expression to extract the name and email address
          const fromMatch = email.from.match(/^(?:"([^"]+)"\s*)?<?([^>]+)>?$/);
          if (fromMatch) {
            const name = fromMatch[1] || fromMatch[2].split('@')[0];
            const emailAddress = fromMatch[2];
            return `${name} <${emailAddress}>`;
          }
        }
        
        // Default to "Unknown"
        return "Unknown";

      }

    return (
        <Box style={openDrawer ? { marginLeft: 280, width: '100%' } : { width: '100%' } }>
            <IconWrapper>
            {/* <Subject>{email.subject} <Indicator component="span">Inbox</Indicator></Subject> */}
                <ArrowBack fontSize='small' color="action" onClick={() => window.history.back()} sx={{ cursor: 'pointer' }} />
                {/* <Delete fontSize='small' color="action" style={{ marginLeft: 40 }} /> */}
            </IconWrapper>
            <Subject>{email.subject} <Indicator component="span">Inbox</Indicator></Subject>
            <Box style={{ display: 'flex' }}>
                <Image src={emptyProfilePic} alt="profile" />
                <Container>
                    <Box>
                        <Typography>
                            from: {parseFromField(email)} 
                            {/* <Box component="span">&nbsp;&#60;{email.from ? email.from : "email@example.com"}&#62;</Box> */}
                        </Typography>
                        <Date>
                            {(new window.Date(email.date)).getDate()}&nbsp;
                            {(new window.Date(email.date)).toLocaleString('default', { month: 'long' })}&nbsp;
                            {(new window.Date(email.date)).getFullYear()} 
                        </Date>
                    </Box>
                    <BodyText>{email.body}</BodyText>
                    <SummarizeEmail email={email} />
                </Container>
            </Box>
        </Box>
    );
}

export default ViewEmail;
