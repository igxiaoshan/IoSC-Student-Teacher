import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import {
  Box,
  Container,
  Typography,
  TextField,
  Paper,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Popup from '../../../components/Popup';

const AddNotice = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector(state => state.user);
  const { currentUser } = useSelector(state => state.user);

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const adminID = currentUser._id;

  const [loader, setLoader] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');

  const fields = { title, details, date, adminID };
  const address = 'Notice';

  const submitHandler = (e) => {
    e.preventDefault();
    setLoader(true);
    dispatch(addStuff(fields, address));
  };

  useEffect(() => {
    if (status === 'added') {
      navigate('/Admin/notices');
      dispatch(underControl());
    } else if (status === 'error') {
      setMessage('Network Error');
      setShowPopup(true);
      setLoader(false);
    }
  }, [status, navigate, dispatch]);

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Add New Notice
        </Typography>
        <Box
          component="form"
          onSubmit={submitHandler}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <TextField
            label="Title"
            fullWidth
            required
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Details"
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loader}
            sx={{
              backgroundColor: '#270843',
              '&:hover': { backgroundColor: '#3f1068' },
              mt: 1
            }}
          >
            Add Notice
          </LoadingButton>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Something went wrong!
        </Alert>
      )}

      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </Container>
  );
};

export default AddNotice;
