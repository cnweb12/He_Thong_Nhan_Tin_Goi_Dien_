// Mock data for users
export const mockUsers = [
  {
    id: 1,
    name: 'User 1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User1',
    lastMessage: 'Thanks! Let\'s catch up again soon',
    timestamp: '09:50',
    online: true
  },
  {
    id: 2,
    name: 'User 2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User2',
    lastMessage: 'I\'ll do my best!',
    timestamp: '08:45',
    online: true
  },
  {
    id: 3,
    name: 'User 3',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User3',
    lastMessage: 'Catch you later!',
    timestamp: '07:15',
    online: false
  },
  {
    id: 4,
    name: 'User 4',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User4',
    lastMessage: 'Tin nhắn gần nhất...',
    timestamp: '11 giờ',
    online: true
  },
  {
    id: 5,
    name: 'User 5',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User5',
    lastMessage: 'Tin nhắn gần nhất...',
    timestamp: '11 giờ',
    online: false
  },
  {
    id: 6,
    name: 'User 6',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User6',
    lastMessage: 'Tin nhắn gần nhất...',
    timestamp: '11 giờ',
    online: true
  }
]

// Mock messages for different conversations
export const mockMessages = {
  1: [
    { id: 1, text: 'Hi there! How are you?', sender: 'other', timestamp: '09:00' },
    { id: 2, text: 'I am doing great, thanks for asking!', sender: 'self', timestamp: '09:05' },
    { id: 3, text: 'That\'s awesome! What have you been up to?', sender: 'other', timestamp: '09:10' },
    { id: 4, text: 'Just working on some projects and learning new things', sender: 'self', timestamp: '09:12' },
    { id: 5, text: 'That sounds interesting! Tell me more', sender: 'other', timestamp: '09:15' },
    { id: 6, text: 'Well, I\'ve been learning React and it\'s quite fun', sender: 'self', timestamp: '09:18' },
    { id: 7, text: 'React is amazing! I love building UI with it', sender: 'other', timestamp: '09:20' },
    { id: 8, text: 'Yes, the component-based approach is really elegant', sender: 'self', timestamp: '09:22' },
    { id: 9, text: 'Exactly! And the hooks API makes it even better', sender: 'other', timestamp: '09:25' },
    { id: 10, text: 'I agree, hooks really changed how we write React code', sender: 'self', timestamp: '09:28' },
    { id: 11, text: 'Have you tried building any complex components?', sender: 'other', timestamp: '09:30' },
    { id: 12, text: 'Yeah, I built a chat application UI recently', sender: 'self', timestamp: '09:32' },
    { id: 13, text: 'Oh wow, that\'s cool! How is it going?', sender: 'other', timestamp: '09:35' },
    { id: 14, text: 'It\'s coming along well! Just working on styling now', sender: 'self', timestamp: '09:38' },
    { id: 15, text: 'Nice! Feel free to share when it\'s done', sender: 'other', timestamp: '09:40' },
    { id: 16, text: 'Will do! I appreciate the encouragement', sender: 'self', timestamp: '09:42' },
    { id: 17, text: 'No problem! Keep up the good work 👍', sender: 'other', timestamp: '09:45' },
    { id: 18, text: 'Thanks! Let\'s catch up again soon', sender: 'self', timestamp: '09:50' },
  ],
  2: [
    { id: 1, text: 'Hey! Did you finish the project?', sender: 'self', timestamp: '08:00' },
    { id: 2, text: 'Almost done! Just need to fix a few bugs', sender: 'other', timestamp: '08:05' },
    { id: 3, text: 'Great! When do you think you\'ll be done?', sender: 'self', timestamp: '08:10' },
    { id: 4, text: 'Probably by end of day', sender: 'other', timestamp: '08:15' },
    { id: 5, text: 'Perfect! Let me know when it\'s ready for review', sender: 'self', timestamp: '08:20' },
    { id: 6, text: 'Will send it over in the afternoon', sender: 'other', timestamp: '08:25' },
    { id: 7, text: 'Sounds good! Looking forward to it', sender: 'self', timestamp: '08:30' },
    { id: 8, text: 'Thanks for your patience', sender: 'other', timestamp: '08:35' },
    { id: 9, text: 'No worries! Take your time to make it perfect', sender: 'self', timestamp: '08:40' },
    { id: 10, text: 'I\'ll do my best!', sender: 'other', timestamp: '08:45' },
  ],
  3: [
    { id: 1, text: 'See you later!', sender: 'other', timestamp: '07:00' },
    { id: 2, text: 'Bye! Have a great day', sender: 'self', timestamp: '07:05' },
    { id: 3, text: 'You too! Talk soon', sender: 'other', timestamp: '07:10' },
    { id: 4, text: 'Catch you later!', sender: 'self', timestamp: '07:15' },
  ],
  4: [
    { id: 1, text: 'Chào bạn! 👋', sender: 'other', timestamp: '10:30' },
    { id: 2, text: 'Chào! Bạn khỏe không?', sender: 'self', timestamp: '10:35' },
    { id: 3, text: 'Mình khỏe, cảm ơn vì hỏi. Bạn sao?', sender: 'other', timestamp: '10:40' },
    { id: 4, text: 'Mình cũng khỏe. Hôm nay bạn bận không?', sender: 'self', timestamp: '10:42' },
    { id: 5, text: 'Không, mình có thời gian. Chúng ta có thể gặp nhau không?', sender: 'other', timestamp: '10:45' },
    { id: 6, text: 'Được, mấy giờ bạn rảnh?', sender: 'self', timestamp: '10:48' },
    { id: 7, text: 'Khoảng 3 giờ chiều được không?', sender: 'other', timestamp: '10:50' },
    { id: 8, text: 'Được rồi, mình sẽ đón bạn', sender: 'self', timestamp: '10:52' },
  ],
  5: [
    { id: 1, text: 'Cần tư vấn chút gì đó', sender: 'self', timestamp: '09:15' },
    { id: 2, text: 'Ok, bạn muốn tư vấn về cái gì?', sender: 'other', timestamp: '09:20' },
    { id: 3, text: 'Về công nghệ mới, bạn có ý kiến gì?', sender: 'self', timestamp: '09:25' },
    { id: 4, text: 'Mình nghĩ nó là tương lai', sender: 'other', timestamp: '09:30' },
  ],
  6: [
    { id: 1, text: 'Alo, bạn nhận được tài liệu chưa?', sender: 'self', timestamp: '11:00' },
    { id: 2, text: 'Rồi, cảm ơn bạn!', sender: 'other', timestamp: '11:05' },
    { id: 3, text: 'Có vấn đề gì không?', sender: 'self', timestamp: '11:10' },
    { id: 4, text: 'Không, rất chi tiết. Cảm ơn một lần nữa 😊', sender: 'other', timestamp: '11:12' },
  ]
}

// Current user
export const currentUser = {
  id: 'current',
  name: 'Me',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser'
}
