import express from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { getUser } from '../cognito/api';

export const router = express.Router();

router.get('/', async (req, res) => {
    res.json({ message: 'Hello from shop!' });
});

router.get('/profile', async (req, res) => {
    const login = req.user as JwtPayload;
    const user = await getUser(login.username!);
    console.log('user', user);
    res.json({
        ...user,
    });
});
