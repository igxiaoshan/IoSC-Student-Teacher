import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { getClassDetails, getClassStudents, getClassTeachers, getSubjectList } from "../../../redux/sclassRelated/sclassHandle";
import { deleteUser } from '../../../redux/userRelated/userHandle';
import {
    Box, Container, Typography, Tab, IconButton
} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { resetSubjects } from "../../../redux/sclassRelated/sclassSlice";
import { BlueButton, GreenButton, PurpleButton } from "../../../components/buttonStyles";
import TableTemplate from "../../../components/TableTemplate";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SpeedDialTemplate from "../../../components/SpeedDialTemplate";
import Popup from "../../../components/Popup";
import DeleteIcon from "@mui/icons-material/Delete";
import PostAddIcon from '@mui/icons-material/PostAdd';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const ClassDetails = () => {
    const params = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const { subjectsList, sclassStudents, sclassTeachers, sclassDetails, loading, error, response, getresponse } = useSelector((state) => state.sclass);

    const classID = params.id

    useEffect(() => {
        dispatch(getClassDetails(classID, "Sclass"));
        dispatch(getSubjectList(classID, "ClassSubjects"))
        dispatch(getClassStudents(classID));
        dispatch(getClassTeachers(classID));
    }, [dispatch, classID])

    if (error) {
        console.log(error)
    }

    const [value, setValue] = useState('1');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const deleteHandler = (deleteID, address) => {
        console.log(deleteID);
        console.log(address);
        setMessage("Sorry the delete function has been disabled for now.")
        setShowPopup(true)
        // dispatch(deleteUser(deleteID, address))
        //     .then(() => {
        //         dispatch(getClassStudents(classID));
        //         dispatch(resetSubjects())
        //         dispatch(getSubjectList(classID, "ClassSubjects"))
        //     })
    }

    const subjectColumns = [
        { id: 'name', label: '科目名称', minWidth: 170 },
        { id: 'code', label: '科目代码', minWidth: 100 },
    ]

    const subjectRows = subjectsList && subjectsList.length > 0 && subjectsList.map((subject) => {
        return {
            name: subject.subName,
            code: subject.subCode,
            id: subject._id,
        };
    })

    const SubjectsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Subject")}>
                    <DeleteIcon color="error" />
                </IconButton>
                <BlueButton
                    variant="contained"
                    onClick={() => {
                        navigate(`/Admin/class/subject/${classID}/${row.id}`)
                    }}
                >
                    查看
                </BlueButton >
            </>
        );
    };

    const subjectActions = [
        {
            icon: <PostAddIcon color="primary" />, name: '添加科目',
            action: () => navigate("/Admin/addsubject/" + classID)
        },
        {
            icon: <DeleteIcon color="error" />, name: '删除所有科目',
            action: () => deleteHandler(classID, "SubjectsClass")
        }
    ];

    const ClassSubjectsSection = () => {
        return (
            <>
                {response ?
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <GreenButton
                            variant="contained"
                            onClick={() => navigate("/Admin/addsubject/" + classID)}
                        >
                            添加科目
                        </GreenButton>
                    </Box>
                    :
                    <>
                        <Typography variant="h5" gutterBottom>
                            科目列表:
                        </Typography>

                        <TableTemplate buttonHaver={SubjectsButtonHaver} columns={subjectColumns} rows={subjectRows} />
                        <SpeedDialTemplate actions={subjectActions} />
                    </>
                }
            </>
        )
    }

    const studentColumns = [
        { id: 'name', label: '姓名', minWidth: 170 },
        { id: 'rollNum', label: '学号', minWidth: 100 },
    ]

    const studentRows = sclassStudents.map((student) => {
        return {
            name: student.name,
            rollNum: student.rollNum,
            id: student._id,
        };
    })

    const StudentsButtonHaver = ({ row }) => {
        return (
            <>
                <IconButton onClick={() => deleteHandler(row.id, "Student")}>
                    <PersonRemoveIcon color="error" />
                </IconButton>
                <BlueButton
                    variant="contained"
                    onClick={() => navigate("/Admin/students/student/" + row.id)}
                >
                    查看
                </BlueButton>
                <PurpleButton
                    variant="contained"
                    onClick={() =>
                        navigate("/Admin/students/student/attendance/" + row.id)
                    }
                >
                    考勤记录
                </PurpleButton>
            </>
        );
    };

    const studentActions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: '添加学生',
            action: () => navigate("/Admin/class/addstudents/" + classID)
        },
        {
            icon: <PersonRemoveIcon color="error" />, name: '删除所有学生',
            action: () => deleteHandler(classID, "StudentsClass")
        },
    ];

    const ClassStudentsSection = () => {
        return (
            <>
                {getresponse ? (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <GreenButton
                                variant="contained"
                                onClick={() => navigate("/Admin/class/addstudents/" + classID)}
                            >
                                添加学生
                            </GreenButton>
                        </Box>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>
                            学生列表:
                        </Typography>

                        <TableTemplate buttonHaver={StudentsButtonHaver} columns={studentColumns} rows={studentRows} />
                        <SpeedDialTemplate actions={studentActions} />
                    </>
                )}
            </>
        )
    }

    const teacherColumns = [
        { id: 'name', label: '姓名', minWidth: 120 },
        { id: 'role', label: '角色', minWidth: 100 },
        { id: 'subjectName', label: '任教科目', minWidth: 120 },
        { id: 'email', label: '邮箱', minWidth: 150 },
        { id: 'phone', label: '电话', minWidth: 120 },
    ]

    const teacherRows = sclassTeachers && sclassTeachers.length > 0 && sclassTeachers.map((teacher) => {
        return {
            name: teacher.name || '未知',
            role: teacher.role || '任课教师',
            subjectName: teacher.subjectName || '未分配科目',
            email: teacher.email || '未设置',
            phone: teacher.phone || '未设置',
            id: teacher._id,
        };
    })

    const TeachersButtonHaver = ({ row }) => {
        return (
            <>
                <BlueButton
                    variant="contained"
                    onClick={() => navigate("/Admin/teachers/teacher/" + row.id)}
                >
                    查看详情
                </BlueButton>
                <PurpleButton
                    variant="contained"
                    onClick={() => navigate("/Admin/teachers/teacher/attendance/" + row.id)}
                >
                    考勤记录
                </PurpleButton>
            </>
        );
    };

    const teacherActions = [
        {
            icon: <PersonAddAlt1Icon color="primary" />, name: '分配教师',
            action: () => navigate("/Admin/teachers/chooseclass/Teacher")
        },
    ];

    const ClassTeachersSection = () => {
        return (
            <>
                {getresponse ? (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <GreenButton
                                variant="contained"
                                onClick={() => navigate("/Admin/teachers/chooseclass/Teacher")}
                            >
                                分配教师
                            </GreenButton>
                        </Box>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>
                            教师列表:
                        </Typography>

                        {sclassTeachers && sclassTeachers.length > 0 ? (
                            <>
                                <TableTemplate
                                    buttonHaver={TeachersButtonHaver}
                                    columns={teacherColumns}
                                    rows={teacherRows}
                                />
                                <SpeedDialTemplate actions={teacherActions} />
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', p: 4 }}>
                                <SchoolIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                                <Typography variant="h6" gutterBottom color="text.secondary">
                                    暂无教师信息
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    该班级还没有分配任何教师
                                </Typography>
                                <GreenButton
                                    variant="contained"
                                    onClick={() => navigate("/Admin/teachers/chooseclass/Teacher")}
                                    startIcon={<PersonAddAlt1Icon />}
                                >
                                    分配教师
                                </GreenButton>
                            </Box>
                        )}
                    </>
                )}
            </>
        )
    }

    const ClassDetailsSection = () => {
        const numberOfSubjects = subjectsList.length;
        const numberOfStudents = sclassStudents.length;
        const numberOfTeachers = sclassTeachers.length;

        return (
            <>
                <Typography variant="h4" align="center" gutterBottom>
                    班级详情
                </Typography>
                <Typography variant="h5" gutterBottom>
                    班级名称: {sclassDetails && sclassDetails.sclassName}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    科目数量: {numberOfSubjects}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    学生数量: {numberOfStudents}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    教师数量: {numberOfTeachers}
                </Typography>
                {getresponse &&
                    <GreenButton
                        variant="contained"
                        onClick={() => navigate("/Admin/class/addstudents/" + classID)}
                    >
                        添加学生
                    </GreenButton>
                }
                {response &&
                    <GreenButton
                        variant="contained"
                        onClick={() => navigate("/Admin/addsubject/" + classID)}
                    >
                        添加科目
                    </GreenButton>
                }
            </>
        );
    }

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <Box sx={{ width: '100%', typography: 'body1', }} >
                        <TabContext value={value}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} sx={{ position: 'fixed', width: '100%', bgcolor: 'background.paper', zIndex: 1 }}>
                                    <Tab label="详情" value="1" />
                                    <Tab label="科目" value="2" />
                                    <Tab label="学生" value="3" />
                                    <Tab label="教师" value="4" />
                                </TabList>
                            </Box>
                            <Container sx={{ marginTop: "3rem", marginBottom: "4rem" }}>
                                <TabPanel value="1">
                                    <ClassDetailsSection />
                                </TabPanel>
                                <TabPanel value="2">
                                    <ClassSubjectsSection />
                                </TabPanel>
                                <TabPanel value="3">
                                    <ClassStudentsSection />
                                </TabPanel>
                                <TabPanel value="4">
                                    <ClassTeachersSection />
                                </TabPanel>
                            </Container>
                        </TabContext>
                    </Box>
                </>
            )}
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default ClassDetails;