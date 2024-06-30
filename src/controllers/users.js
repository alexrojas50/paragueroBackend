import User from "../models/user.js";
import { generateHash, verifyPassword } from "../utils/bcrypt.js";
import { createJWT, verifyJWT } from "../utils/jwt.js";

export class usersController {
    static async login(req, res) {
        try {
            const { userEmail, password } = req.body

            if (!userEmail || !password) return res.status(400).json({ error: `Completa todos los campos` })

            const user = await User.findOne({ email: userEmail })

            if (!user) return res.status(400).json({ error: `No existe una cuenta con el email ${userEmail}` })

            if (!await verifyPassword(password, user.password)) return res.status(400).json({ error: `Contraseña Incorrecta` })

            const initToken = await createJWT({ name: user.name, email: user.email })

            return res.send({ token: initToken, username: user.name, email: user.email, level: user.level })
        } catch (error) {
            console.log('Error :', error);
            if (error.message) return res.status(400).json({ error: error.message })
            return res.status(400).json({ error })
        }
    }

    static async getUsers(req, res) {
        try {
            const { userId } = req.body

            const filter = { active: true }

            if (userId) {
                filter._id = userId
                const userFind = await User.findOne(filter, { password: 0 })
                if (!userFind) return res.status(400).json({ error: 'Usuario no encontrado' })
                return res.send(userFind)
            }

            const usersFind = await User.find(filter, { password: 0 })
            return res.status(202).json({ users: usersFind })
        } catch (error) {
            if (error.message) return res.status(400).json({ error: error.message })
            return res.status(400).json({ error })
        }
    }

    static async createUser(req, res) {
        try {
            const { userName, password, userEmail } = req.body
            if (!userName || !password || !userEmail) return res.status(400).json({ error: 'Completa todos los campos' })

            const newHashPassword = await generateHash(password)

            // Realizar validaciones para username and password

            const newUser = new User({ userName: userName, userPassword: newHashPassword, userEmail: userEmail, userLevel: 2 })
            await newUser.save()

            const initToken = await createJWT({ userName: newUser.userName, userEmail: newUser.userEmail })
            return res.status(202).json({ token: initToken, userName: newUser.userName, userEmail: newUser.userEmail })

        } catch (error) {
            if (error.message) return res.status(400).json({ error: error.message })
            return res.status(400).json({ error })
        }
    }


    static async updateUser(req, res) {
        try {
            const { userName, password, userEmail, userId } = req.body;
            if (!userName && !password && !userEmail) return res.status(400).json({ error: 'No has enviado ningún dato' });
            if (!userId) return res.status(400).json({ error: 'Debes de enviar el usuario a actualizar' });

            const userToUpdate = User.findOne({ _id: userId });

            if (!userToUpdate) return res.status(400).json({ error: 'No se ha encontrado a este usuario' });

            const update = {};

            if (password) update.password = await generateHash(password);
            if (userName) update.userName = userName;
            if (userEmail) update.userEmail = userEmail;

            // Realizar validaciones para username and password

            await User.updateOne({ _id: userId }, { $set: update });
            return res.status(202).json({ message: 'Usuario Actualizado' });

        } catch (error) {
            if (error.message) return res.status(400).json({ error: error.message });
            return res.status(400).json({ error });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ error: 'Debes de enviar el usuario a eliminar' });

            const userToUpdate = User.findOne({ _id: userId });

            if (!userToUpdate) return res.status(400).json({ error: 'No se ha encontrado a este usuario' });

            await User.updateOne({ _id: userId }, { $set: { active: false } });
            return res.status(202).json({ message: 'Usuario Actualizado' });

        } catch (error) {
            if (error.message) return res.status(400).json({ error: error.message });
            return res.status(400).json({ error });
        }
    }

    static async verifyToken(req, res) {
        try {

            const { authorization } = req.headers
            if (!authorization) return res.json({ status: false })

            const infoUser = await verifyJWT(authorization)
            console.log('INFO USER ', infoUser);
            if (!infoUser || !infoUser.email) return res.json({ status: false })

            const user = await User.findOne({ email: infoUser.email }, { password: 0 })
            if (!user) return res.json({ status: false })
            return res.json({ status: true, user: user })

        } catch (error) {
            if (error.message) return res.status(400).json({ error: error.message })
            return res.status(400).json({ error })
        }
    }
}