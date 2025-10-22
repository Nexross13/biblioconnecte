const userModel = require('../models/userModel');
const friendshipModel = require('../models/friendshipModel');
const {
  getUsers: getMockUsers,
  getUserById: getMockUserById,
  getFriendsOfUser,
} = require('../data/mockData');

const listUsers = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const users = getMockUsers();
      return res.json({ users });
    }
    const users = await userModel.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (process.env.USE_MOCKS === 'true') {
      const mockUser = getMockUserById(req.params.id);
      if (!mockUser) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      return res.json({ user: mockUser });
    }

    const user = await userModel.findById(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const ensureSelfAction = (req, targetId) => {
  if (Number(req.user.id) !== Number(targetId)) {
    const error = new Error('You are not allowed to perform this action');
    error.status = 403;
    throw error;
  }
};

const listFriends = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, userId);
    if (process.env.USE_MOCKS === 'true') {
      const friends = getFriendsOfUser(userId);
      return res.json({ friends });
    }
    const friends = await friendshipModel.listFriends(userId);
    res.json({ friends });
  } catch (error) {
    next(error);
  }
};

const requestFriend = async (req, res, next) => {
  try {
    const requesterId = Number(req.user.id);
    const addresseeId = Number(req.params.id);

    if (!Number.isInteger(addresseeId)) {
      const err = new Error('Invalid friend identifier');
      err.status = 400;
      throw err;
    }

    if (requesterId === addresseeId) {
      const err = new Error('You cannot befriend yourself');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(201).json({
        friendship: {
          requesterId,
          addresseeId,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        },
      });
    }

    const friendship = await friendshipModel.createFriendRequest({ requesterId, addresseeId });
    res.status(201).json({ friendship });
  } catch (error) {
    next(error);
  }
};

const acceptFriend = async (req, res, next) => {
  try {
    const addresseeId = Number(req.params.id);
    const requesterId = Number(req.params.friendId);
    if (!Number.isInteger(addresseeId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, addresseeId);

    if (!Number.isInteger(requesterId)) {
      const err = new Error('Invalid friend identifier');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.json({
        friendship: {
          requesterId,
          addresseeId,
          status: 'accepted',
          requestedAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        },
      });
    }

    const friendship = await friendshipModel.acceptFriendRequest({ requesterId, addresseeId });
    if (!friendship) {
      const err = new Error('Friend request not found');
      err.status = 404;
      throw err;
    }

    res.json({ friendship });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const friendId = Number(req.params.friendId);
    if (!Number.isInteger(userId)) {
      const err = new Error('Invalid user identifier');
      err.status = 400;
      throw err;
    }
    ensureSelfAction(req, userId);

    if (!Number.isInteger(friendId)) {
      const err = new Error('Invalid friend identifier');
      err.status = 400;
      throw err;
    }

    if (process.env.USE_MOCKS === 'true') {
      return res.status(204).send();
    }

    const deleted = await friendshipModel.removeFriendship({ userId, friendId });
    if (!deleted) {
      const err = new Error('Friendship not found');
      err.status = 404;
      throw err;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserById,
  listFriends,
  requestFriend,
  acceptFriend,
  removeFriend,
};
