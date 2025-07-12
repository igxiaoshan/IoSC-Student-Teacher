import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Box,
  Typography,
  CircularProgress,
  Checkbox,
  Container
} from '@mui/material';
import { getAllComplains } from '../../../redux/complainRelated/complainHandle';
import TableTemplate from '../../../components/TableTemplate';

const SeeComplains = () => {
  const dispatch = useDispatch();
  const { complainsList, loading, error, response } = useSelector((state) => state.complain);
  const { currentUser } = useSelector(state => state.user);

  useEffect(() => {
    dispatch(getAllComplains(currentUser._id, "Complain"));
  }, [currentUser._id, dispatch]);

  const label = { inputProps: { 'aria-label': 'Checkbox demo' } };

  const complainColumns = [
    { id: 'user', label: 'User', minWidth: 170 },
    { id: 'complaint', label: 'Complaint', minWidth: 200 },
    { id: 'date', label: 'Date', minWidth: 120 },
  ];

  const complainRows = complainsList && complainsList.length > 0 && complainsList.map((complain) => {
    const date = new Date(complain.date);
    const dateString = date.toString() !== "Invalid Date" ? date.toISOString().substring(0, 10) : "Invalid Date";
    return {
      user: complain.user.name,
      complaint: complain.complaint,
      date: dateString,
      id: complain._id,
    };
  });

  const ComplainButtonHaver = ({ row }) => (
    <Checkbox {...label} />
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Student Complaints
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
          <CircularProgress />
        </Box>
      ) : response || !complainsList?.length ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="25vh"
          sx={{ backgroundColor: '#f5f5f5', borderRadius: 2, p: 3 }}
        >
          <Typography variant="body1" color="text.secondary">
            No complaints found at the moment.
          </Typography>
        </Box>
      ) : (
        <Paper
          elevation={3}
          sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, mt: 2 }}
        >
          <TableTemplate
            buttonHaver={ComplainButtonHaver}
            columns={complainColumns}
            rows={complainRows}
          />
        </Paper>
      )}
    </Container>
  );
};

export default SeeComplains;
