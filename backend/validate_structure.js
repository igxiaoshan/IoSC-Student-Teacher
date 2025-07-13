const fs = require('fs');
const path = require('path');

console.log('🔍 验证班级管理模块结构...\n');

// 检查文件是否存在
function checkFile(filePath, description) {
    const fullPath = path.join(__dirname, filePath);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
    return exists;
}

// 检查文件内容是否包含特定内容
function checkFileContent(filePath, searchText, description) {
    try {
        const fullPath = path.join(__dirname, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const contains = content.includes(searchText);
        console.log(`${contains ? '✅' : '❌'} ${description}`);
        return contains;
    } catch (error) {
        console.log(`❌ ${description} (文件读取失败)`);
        return false;
    }
}

console.log('📁 检查核心文件结构:');
checkFile('models/sclassSchema.js', '班级数据模型');
checkFile('controllers/class-controller.js', '班级控制器');
checkFile('validation/classValidation.js', '班级验证中间件');
checkFile('routes/route.js', '路由配置');

console.log('\n🔧 检查模型功能:');
checkFileContent('models/sclassSchema.js', 'description', '包含描述字段');
checkFileContent('models/sclassSchema.js', 'grade', '包含年级字段');
checkFileContent('models/sclassSchema.js', 'maxStudents', '包含最大学生数字段');
checkFileContent('models/sclassSchema.js', 'status', '包含状态字段');
checkFileContent('models/sclassSchema.js', 'academicYear', '包含学年字段');
checkFileContent('models/sclassSchema.js', 'updateStudentCount', '包含学生数量更新方法');

console.log('\n🎮 检查控制器功能:');
checkFileContent('controllers/class-controller.js', 'sclassCreate', '包含创建功能');
checkFileContent('controllers/class-controller.js', 'sclassList', '包含列表功能');
checkFileContent('controllers/class-controller.js', 'getSclassDetail', '包含详情功能');
checkFileContent('controllers/class-controller.js', 'updateSclass', '包含更新功能');
checkFileContent('controllers/class-controller.js', 'deleteSclass', '包含删除功能');
checkFileContent('controllers/class-controller.js', 'batchDeleteSclasses', '包含批量删除功能');
checkFileContent('controllers/class-controller.js', 'getClassStatistics', '包含统计功能');

console.log('\n🛡️ 检查验证功能:');
checkFileContent('validation/classValidation.js', 'createClassValidation', '包含创建验证');
checkFileContent('validation/classValidation.js', 'updateClassValidation', '包含更新验证');
checkFileContent('validation/classValidation.js', 'getClassListValidation', '包含列表查询验证');
checkFileContent('validation/classValidation.js', 'batchDeleteValidation', '包含批量删除验证');
checkFileContent('validation/classValidation.js', 'handleValidationErrors', '包含错误处理');

console.log('\n🛣️ 检查路由配置:');
checkFileContent('routes/route.js', 'SclassCreate', '包含创建路由');
checkFileContent('routes/route.js', 'SclassList', '包含列表路由');
checkFileContent('routes/route.js', 'SclassStats', '包含统计路由');
checkFileContent('routes/route.js', 'SclassBatch', '包含批量操作路由');
checkFileContent('routes/route.js', 'createClassValidation', '包含验证中间件');

console.log('\n📦 检查依赖:');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    console.log(`${dependencies['express-validator'] ? '✅' : '❌'} express-validator: ${dependencies['express-validator'] || '未安装'}`);
    console.log(`${dependencies['mongoose'] ? '✅' : '❌'} mongoose: ${dependencies['mongoose'] || '未安装'}`);
    console.log(`${dependencies['express'] ? '✅' : '❌'} express: ${dependencies['express'] || '未安装'}`);
} catch (error) {
    console.log('❌ 无法读取package.json');
}

console.log('\n📋 检查前端文件:');
const frontendPath = '../frontend/src';
checkFile(`${frontendPath}/redux/sclassRelated/sclassSlice.js`, '前端状态管理');
checkFile(`${frontendPath}/redux/sclassRelated/sclassHandle.js`, '前端API调用');
checkFile(`${frontendPath}/pages/admin/classRelated/EnhancedShowClasses.js`, '增强班级列表组件');
checkFile(`${frontendPath}/pages/admin/classRelated/ClassStatistics.js`, '班级统计组件');

console.log('\n🧪 检查测试文件:');
checkFile('test/classTest.js', '单元测试文件');

console.log('\n📚 检查文档:');
checkFile('../CLASS_MODULE_README.md', '功能文档');

console.log('\n🎯 功能验证总结:');

// 尝试加载模块以验证语法
try {
    require('./models/sclassSchema.js');
    console.log('✅ 班级模型语法正确');
} catch (error) {
    console.log('❌ 班级模型语法错误:', error.message);
}

try {
    require('./validation/classValidation.js');
    console.log('✅ 验证中间件语法正确');
} catch (error) {
    console.log('❌ 验证中间件语法错误:', error.message);
}

try {
    const controller = require('./controllers/class-controller.js');
    const methods = Object.keys(controller);
    console.log(`✅ 控制器导出 ${methods.length} 个方法:`, methods.join(', '));
} catch (error) {
    console.log('❌ 控制器语法错误:', error.message);
}

console.log('\n🏆 班级管理模块结构验证完成！');
console.log('\n💡 注意: 要完全测试功能，需要:');
console.log('   1. 启动MongoDB服务');
console.log('   2. 配置正确的数据库连接');
console.log('   3. 运行完整的集成测试');
