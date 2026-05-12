const fs = require('fs');

// === Fix streamingLearningAssistant-controller.js ===
let f1 = fs.readFileSync('controllers/streamingLearningAssistant-controller.js', 'utf8');

// 1) streamLearningAssistant: 解构添加 userType
f1 = f1.replace(
  'const { studentId, subjectId, question, conversationId } = req.body;',
  'const { studentId, subjectId, question, conversationId, userType } = req.body;\r\n\r\n  const difyUserType = userType === \'teacher\' ? \'老师\' : \'学生\';',
  1 // only first occurrence
);

// 2) context 中添加 userType (流式)
f1 = f1.replace(
  "studentHistory: '暂无历史记录'\r\n  };\r\n\r\n  // 流式回调",
  "studentHistory: '暂无历史记录',\r\n    userType: difyUserType\r\n  };\r\n\r\n  // 流式回调"
);

// 3) chatLearningAssistant: 同样添加 userType
let secondOccurIdx = f1.indexOf('const { studentId, subjectId, question, conversationId } = req.body;', f1.indexOf('chatLearningAssistant'));
if (secondOccurIdx > -1) {
  f1 = f1.substring(0, secondOccurIdx) +
    "const { studentId, subjectId, question, conversationId, userType } = req.body;\r\n\r\n  const difyUserType = userType === 'teacher' ? '老师' : '学生';" +
    f1.substring(secondOccurIdx + 'const { studentId, subjectId, question, conversationId } = req.body;'.length);
}

// 4) 第二个 context 也添加 userType (非流式)
f1 = f1.replace(
  "studentHistory: '暂无历史记录'\r\n  };\r\n\r\n  // 调用Dify API",
  "studentHistory: '暂无历史记录',\r\n    userType: difyUserType\r\n  };\r\n\r\n  // 调用Dify API"
);

// 5) 修复 ERR_STREAM_WRITE_AFTER_END: onError 中检查 res.writableEnded
f1 = f1.replace(
  "const onError = (error) => {\r\n    console.error('流式对话错误:', error);\r\n    res.write",
  "const onError = (error) => {\r\n    console.error('流式对话错误:', error);\r\n    if (res.writableEnded) return;\r\n    res.write"
);

fs.writeFileSync('controllers/streamingLearningAssistant-controller.js', f1);
console.log('streamingLearningAssistant-controller.js fixed');

// === Fix difyService.js ===
let f2 = fs.readFileSync('services/difyService.js', 'utf8');

// chatWithLearningAssistant: userType from context
f2 = f2.replace(
  "userType: 'student',\r\n        },\r\n        query: message,\r\n        response_mode: 'blocking'",
  "userType: context.userType || '学生',\r\n        },\r\n        query: message,\r\n        response_mode: 'blocking'"
);

// chatWithLearningAssistantStream: userType from context
f2 = f2.replace(
  "userType: 'student',\r\n        },\r\n        query: message,\r\n        response_mode: 'streaming'",
  "userType: context.userType || '学生',\r\n        },\r\n        query: message,\r\n        response_mode: 'streaming'"
);

// 修复 callDifyStreamingAPI 中 onComplete 双重调用问题
// 当 [DONE] 触发 onComplete 后，stream end 也会触发，需防重
f2 = f2.replace(
  "response.data.on('end', () => {\r\n      if (onComplete) {\r\n        onComplete({\r\n          conversationId,\r\n          messageId,\r\n          fullContent: this.filterAIResponse(fullContent)\r\n        });\r\n      }\r\n    });",
  "response.data.on('end', () => {\r\n      if (onComplete && !completed) {\r\n        completed = true;\r\n        onComplete({\r\n          conversationId,\r\n          messageId,\r\n          fullContent: this.filterAIResponse(fullContent)\r\n        });\r\n      }\r\n    });"
);

// 在 callDifyStreamingAPI 方法中添加 completed 标记
f2 = f2.replace(
  "let buffer = '';\r\n    let conversationId = '';\r\n    let messageId = '';\r\n    let fullContent = '';",
  "let buffer = '';\r\n    let conversationId = '';\r\n    let messageId = '';\r\n    let fullContent = '';\r\n    let completed = false;"
);

// [DONE] 处中也设置 completed
f2 = f2.replace(
  "if (jsonStr === '[DONE]') {\r\n              if (onComplete) {\r\n                onComplete({",
  "if (jsonStr === '[DONE]') {\r\n              if (onComplete && !completed) {\r\n                completed = true;\r\n                onComplete({"
);

fs.writeFileSync('services/difyService.js', f2);
console.log('difyService.js fixed');
