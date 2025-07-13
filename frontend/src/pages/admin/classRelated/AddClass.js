import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, TextField } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import { BlueButton } from "../../../components/buttonStyles";
import Popup from "../../../components/Popup";
import Classroom from "../../../assets/classroom.png";
import styled from "styled-components";

const AddClass = () => {
    const [formData, setFormData] = useState({
        sclassName: "",
        description: "",
        grade: "",
        maxStudents: 50,
        academicYear: ""
    });

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const userState = useSelector(state => state.user);
    const { status, currentUser, response, error, tempDetails } = userState;

    const adminID = currentUser._id
    const address = "Sclass"

    const [loader, setLoader] = useState(false)
    const [message, setMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    const handleInputChange = (field) => (event) => {
        setFormData({
            ...formData,
            [field]: event.target.value
        });
    };

    const fields = {
        ...formData,
        adminID,
    };

    const submitHandler = (event) => {
        event.preventDefault()
        setLoader(true)
        dispatch(addStuff(fields, address))
    };

    useEffect(() => {
        if (status === 'added' && tempDetails) {
            navigate("/Admin/classes/class/" + tempDetails._id)
            dispatch(underControl())
            setLoader(false)
        }
        else if (status === 'failed') {
            setMessage(response)
            setShowPopup(true)
            setLoader(false)
        }
        else if (status === 'error') {
            setMessage("Network Error")
            setShowPopup(true)
            setLoader(false)
        }
    }, [status, navigate, error, response, dispatch, tempDetails]);
    return (
        <>
            <StyledContainer>
                <StyledBox>
                    <Stack sx={{
                        alignItems: 'center',
                        mb: 3
                    }}>
                        <img
                            src={Classroom}
                            alt="classroom"
                            style={{ width: '80%' }}
                        />
                    </Stack>
                    <form onSubmit={submitHandler}>
                        <Stack spacing={3}>
                            <TextField
                                label="班级名称"
                                variant="outlined"
                                value={formData.sclassName}
                                onChange={handleInputChange('sclassName')}
                                required
                                placeholder="例如：高一(1)班"
                            />

                            <TextField
                                label="班级描述"
                                variant="outlined"
                                value={formData.description}
                                onChange={handleInputChange('description')}
                                multiline
                                rows={3}
                                placeholder="班级的简要描述（可选）"
                            />

                            <TextField
                                label="年级"
                                variant="outlined"
                                value={formData.grade}
                                onChange={handleInputChange('grade')}
                                placeholder="例如：一年级、高一"
                            />

                            <TextField
                                label="最大学生数"
                                type="number"
                                variant="outlined"
                                value={formData.maxStudents}
                                onChange={handleInputChange('maxStudents')}
                                inputProps={{ min: 1, max: 100 }}
                                helperText="班级可容纳的最大学生数量（1-100）"
                            />

                            <TextField
                                label="学年"
                                variant="outlined"
                                value={formData.academicYear}
                                onChange={handleInputChange('academicYear')}
                                placeholder="例如：2023-2024"
                                helperText="格式：YYYY-YYYY"
                            />

                            <BlueButton
                                fullWidth
                                size="large"
                                sx={{ mt: 3 }}
                                variant="contained"
                                type="submit"
                                disabled={loader}
                            >
                                {loader ? <CircularProgress size={24} color="inherit" /> : "创建班级"}
                            </BlueButton>
                            <Button variant="outlined" onClick={() => navigate(-1)}>
                                返回
                            </Button>
                        </Stack>
                    </form>
                </StyledBox>
            </StyledContainer>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    )
}

export default AddClass

const StyledContainer = styled(Box)`
  flex: 1 1 auto;
  align-items: center;
  display: flex;
  justify-content: center;
`;

const StyledBox = styled(Box)`
  max-width: 550px;
  padding: 50px 3rem 50px;
  margin-top: 1rem;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border: 1px solid #ccc;
  border-radius: 4px;
`;