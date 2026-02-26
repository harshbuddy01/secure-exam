import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Exam from './src/models/Exam.js';
import Question from './src/models/Question.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        // 1. Create Admin user
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);

        let admin = await User.findOne({ email: 'admin@test.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@test.com',
                password: adminPassword,
                role: 'admin'
            });
            console.log('✅ Admin created:', admin.email);
        } else {
            console.log('ℹ️  Admin already exists:', admin.email);
        }

        // 2. Create Exam
        let exam = await Exam.findOne({ title: 'Computer Science 101 Midterm' });
        if (!exam) {
            exam = await Exam.create({
                title: 'Computer Science 101 Midterm',
                description: 'Test your basic CS knowledge',
                durationMinutes: 30,
                isActive: true,
                createdBy: admin._id
            });
            console.log('✅ Exam created:', exam.title, '| ID:', exam._id);
        } else {
            console.log('ℹ️  Exam already exists:', exam.title, '| ID:', exam._id);
        }

        // 3. Seed Questions
        const existingQ = await Question.countDocuments({ examId: exam._id });
        if (existingQ === 0) {
            const questions = [
                {
                    examId: exam._id,
                    text: 'What does CPU stand for?',
                    options: ['Central Process Unit', 'Computer Personal Unit', 'Central Processing Unit', 'Central Processor Unit'],
                    correctIndex: 2,
                    marks: 5
                },
                {
                    examId: exam._id,
                    text: 'Which of these is NOT a programming language?',
                    options: ['Python', 'Java', 'HDMI', 'C++'],
                    correctIndex: 2,
                    marks: 5
                },
                {
                    examId: exam._id,
                    text: 'What is the time complexity of binary search?',
                    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
                    correctIndex: 1,
                    marks: 5
                },
                {
                    examId: exam._id,
                    text: 'Which data structure uses FIFO?',
                    options: ['Stack', 'Queue', 'Tree', 'Graph'],
                    correctIndex: 1,
                    marks: 5
                },
                {
                    examId: exam._id,
                    text: 'What does HTML stand for?',
                    options: ['Hyper Text Makeup Language', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language'],
                    correctIndex: 1,
                    marks: 5
                }
            ];
            await Question.insertMany(questions);
            console.log('✅ 5 Questions seeded for exam:', exam._id);
        } else {
            console.log('ℹ️  Questions already exist:', existingQ);
        }

        console.log('\n🎯 EXAM ID TO USE:', exam._id.toString());
        console.log('👤 Student login: student@test.com / student123');
        console.log('👑 Admin login:   admin@test.com / admin123\n');

        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
};

seed();
