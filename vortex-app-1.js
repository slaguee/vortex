// ============================================
// VORTEX - JAVASCRIPT PARTIE 1
// Auth, Data Manager, Captcha, Vortex Bot
// ============================================

// ============================================
// APP STATE
// ============================================
const AppState = {
    currentUser: null,
    currentView: 'home', // 'home', 'dm', 'server', 'channel'
    currentDM: null,
    currentServer: null,
    currentChannel: null,
    isLoginMode: false,
    captchaAnswer: 0,
    captchaQuestion: '',
    friends: [],
    servers: {},
    voiceState: {
        connected: false,
        channelId: null,
        channelName: '',
        micMuted: false,
        audioMuted: false
    },
    callState: {
        active: false,
        type: null, // 'voice' or 'video'
        with: null
    },
    membersSidebarOpen: false,
    avatarColor: '#5865f2',
    bannerColor: '#5865f2'
};

// ============================================
// DATA MANAGER
// ============================================
class DataManager {
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    static get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    static getAllUsers() {
        return this.get('vortexUsers') || {};
    }

    static saveUser(username, userData) {
        const users = this.getAllUsers();
        users[username] = userData;
        this.save('vortexUsers', users);
    }

    static getUserByUsername(username) {
        const users = this.getAllUsers();
        return users[username] || null;
    }

    static getCurrentUser() {
        return this.get('vortexUser');
    }

    static setCurrentUser(userData) {
        this.save('vortexUser', userData);
        AppState.currentUser = userData;
    }

    static getFriends(username) {
        const allFriends = this.get('vortexFriends') || {};
        return allFriends[username] || [];
    }

    static saveFriend(username, friendUsername) {
        const allFriends = this.get('vortexFriends') || {};
        if (!allFriends[username]) {
            allFriends[username] = [];
        }
        if (!allFriends[username].includes(friendUsername)) {
            allFriends[username].push(friendUsername);
        }
        this.save('vortexFriends', allFriends);
    }

    static removeFriend(username, friendUsername) {
        const allFriends = this.get('vortexFriends') || {};
        if (allFriends[username]) {
            allFriends[username] = allFriends[username].filter(f => f !== friendUsername);
            this.save('vortexFriends', allFriends);
        }
    }

    static getDMMessages(dmId) {
        const allDMs = this.get('vortexDMs') || {};
        return allDMs[dmId] || [];
    }

    static saveDMMessage(dmId, message) {
        const allDMs = this.get('vortexDMs') || {};
        if (!allDMs[dmId]) {
            allDMs[dmId] = [];
        }
        allDMs[dmId].push(message);
        this.save('vortexDMs', allDMs);
    }

    static getChannelMessages(channelId) {
        const allMessages = this.get('vortexChannelMessages') || {};
        return allMessages[channelId] || [];
    }

    static saveChannelMessage(channelId, message) {
        const allMessages = this.get('vortexChannelMessages') || {};
        if (!allMessages[channelId]) {
            allMessages[channelId] = [];
        }
        allMessages[channelId].push(message);
        this.save('vortexChannelMessages', allMessages);
    }

    static getAllServers() {
        return this.get('vortexServers') || {};
    }

    static saveServer(serverId, serverData) {
        const servers = this.getAllServers();
        servers[serverId] = serverData;
        this.save('vortexServers', servers);
    }

    static getUserServers(username) {
        const allServers = this.getAllServers();
        const userServers = {};
        
        for (const [serverId, server] of Object.entries(allServers)) {
            if (server.members && server.members.includes(username)) {
                userServers[serverId] = server;
            }
        }
        
        return userServers;
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static generateTag() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    static generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
}

// ============================================
// VORTEX BOT - IA INTELLIGENTE
// ============================================
class VortexBot {
    static botUser = {
        username: 'Vortex Bot',
        tag: '0001',
        avatar: '🤖',
        avatarColor: '#5865f2',
        isBot: true
    };

    static responses = {
        greetings: [
            "Salut ! Je suis Vortex Bot 🤖 Comment puis-je t'aider aujourd'hui ?",
            "Hey ! Ravi de te parler ! Que puis-je faire pour toi ?",
            "Bonjour ! Je suis là pour discuter et répondre à tes questions !",
            "Coucou ! Vortex Bot à ton service ! 👋"
        ],
        
        help: [
            "Je peux t'aider avec plein de choses ! Tu peux me demander l'heure, des blagues, des conseils, ou juste discuter ! 💬",
            "Voici ce que je peux faire : te donner l'heure, raconter des blagues, donner des conseils, parler de technologie, et bien plus ! Essaye de me poser une question !",
            "Je suis là pour t'aider ! Pose-moi n'importe quelle question ou dis-moi juste 'blague' pour rire un peu 😄"
        ],

        jokes: [
            "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau ! 😂",
            "Qu'est-ce qu'un crocodile qui surveille une caserne ? Un Lacoste garde ! 🐊",
            "Pourquoi les poissons n'aiment pas jouer au tennis ? Parce qu'ils ont peur du filet ! 🎾🐟",
            "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël ! 🎨🐱",
            "Qu'est-ce qu'un cannibale qui mange son père et sa mère ? Un orphelin ! 😅"
        ],

        compliments: [
            "Tu es incroyable ! Continue comme ça ! ✨",
            "Tu as un super goût en matière de plateformes de chat ! 😎",
            "Je suis sûr que tu es une personne géniale ! 🌟",
            "Ton énergie est contagieuse ! Keep going ! 💪"
        ],

        advice: [
            "Mon conseil : prends toujours du temps pour toi, même 5 minutes par jour font la différence ! 🧘",
            "N'oublie pas de boire de l'eau régulièrement ! L'hydratation c'est important ! 💧",
            "Parfois, la meilleure chose à faire c'est de faire une pause et respirer profondément. 🌬️",
            "Crois en toi ! Tu es capable de plus que tu ne le penses ! 💫"
        ],

        tech: [
            "La technologie évolue si vite ! Savais-tu que les premiers ordinateurs occupaient des pièces entières ? 🖥️",
            "L'IA progresse chaque jour ! Bientôt on aura des robots partout... enfin, je suis déjà là ! 🤖",
            "Le cloud computing a révolutionné le monde ! Tes données sont dans les nuages ☁️",
            "JavaScript est le langage le plus utilisé au monde ! Et c'est grâce à lui que j'existe ! 💻"
        ],

        unknown: [
            "Hmm, je ne suis pas sûr de comprendre. Peux-tu reformuler ? 🤔",
            "Intéressant ! Je ne connais pas encore la réponse à ça. Essaye de me poser une autre question !",
            "Désolé, je suis encore en train d'apprendre ! Pose-moi une question sur l'heure, les blagues, ou la tech ! 📚",
            "Je ne suis pas sûr... Mais je sais raconter des blagues ! Veux-tu en entendre une ? 😄"
        ],

        goodbye: [
            "À plus tard ! C'était cool de discuter avec toi ! 👋",
            "Bye ! N'hésite pas à revenir quand tu veux ! 😊",
            "Salut ! Passe une excellente journée ! ☀️",
            "Ciao ! À bientôt sur Vortex ! 🚀"
        ]
    };

    static getResponse(message) {
        const msg = message.toLowerCase();

        // Salutations
        if (msg.match(/^(salut|bonjour|hey|coucou|hello|hi)/)) {
            return this.randomChoice(this.responses.greetings);
        }

        // Au revoir
        if (msg.match(/(au revoir|bye|ciao|à plus|salut|adieu)/)) {
            return this.randomChoice(this.responses.goodbye);
        }

        // Aide
        if (msg.match(/(aide|help|commande|que peux-tu faire|quoi faire)/)) {
            return this.randomChoice(this.responses.help);
        }

        // Blagues
        if (msg.match(/(blague|joke|rigole|drôle|marrant|rire)/)) {
            return this.randomChoice(this.responses.jokes);
        }

        // Heure
        if (msg.match(/(heure|temps|quelle heure|time)/)) {
            const now = new Date();
            return `Il est actuellement ${now.toLocaleTimeString('fr-FR')} ! ⏰`;
        }

        // Date
        if (msg.match(/(date|jour|aujourd'hui|quel jour)/)) {
            const now = new Date();
            return `Nous sommes le ${now.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })} ! 📅`;
        }

        // Compliments
        if (msg.match(/(merci|cool|génial|super|awesome|top)/)) {
            return this.randomChoice(this.responses.compliments);
        }

        // Conseils
        if (msg.match(/(conseil|advice|tip|astuce|recommandation)/)) {
            return this.randomChoice(this.responses.advice);
        }

        // Technologie
        if (msg.match(/(tech|technologie|ordinateur|code|programmation|ai|ia)/)) {
            return this.randomChoice(this.responses.tech);
        }

        // Météo simulée
        if (msg.match(/(météo|meteo|temps qu'il fait|weather)/)) {
            const conditions = ['ensoleillé ☀️', 'nuageux ☁️', 'pluvieux 🌧️', 'partiellement nuageux ⛅'];
            const temp = Math.floor(Math.random() * 20) + 10;
            return `Il fait ${temp}°C et c'est ${this.randomChoice(conditions)} aujourd'hui !`;
        }

        // Comment vas-tu
        if (msg.match(/(comment vas-tu|ça va|comment tu vas|how are you)/)) {
            return "Je vais super bien merci ! Je suis toujours prêt à discuter ! Et toi ? 😊";
        }

        // Qui es-tu
        if (msg.match(/(qui es-tu|c'est quoi|ton nom|qui tu es|what are you)/)) {
            return "Je suis Vortex Bot ! Un assistant IA créé pour t'aider et discuter avec toi sur Vortex ! 🤖✨";
        }

        // Calculs simples
        const calcMatch = msg.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
        if (calcMatch) {
            const num1 = parseFloat(calcMatch[1]);
            const op = calcMatch[2];
            const num2 = parseFloat(calcMatch[3]);
            let result;
            
            switch(op) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num1 / num2; break;
            }
            
            return `${num1} ${op} ${num2} = ${result} ! 🧮`;
        }

        // Réponse par défaut
        return this.randomChoice(this.responses.unknown);
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static sendAutoReply(dmId, userMessage, delay = 1000) {
        setTimeout(() => {
            const botResponse = this.getResponse(userMessage);
            const message = {
                id: DataManager.generateId(),
                dmId: dmId,
                authorId: 'vortex-bot',
                authorName: this.botUser.username,
                authorAvatar: this.botUser.avatar,
                avatarColor: this.botUser.avatarColor,
                text: botResponse,
                timestamp: new Date().toISOString(),
                isBot: true
            };
            
            DataManager.saveDMMessage(dmId, message);
            
            // Si on est sur la conversation avec le bot, afficher le message
            if (AppState.currentDM && AppState.currentDM.username === 'Vortex Bot') {
                Messages.renderMessage(message, document.getElementById('messagesContainer'));
                const container = document.getElementById('messagesContainer');
                container.scrollTop = container.scrollHeight;
            }
        }, delay);
    }

    static initBot() {
        // Ajouter le bot comme ami automatiquement pour tous les utilisateurs
        const users = DataManager.getAllUsers();
        for (const username in users) {
            const friends = DataManager.getFriends(username);
            if (!friends.includes('Vortex Bot')) {
                DataManager.saveFriend(username, 'Vortex Bot');
            }
        }
        
        // Sauvegarder le bot comme utilisateur
        if (!DataManager.getUserByUsername('Vortex Bot')) {
            DataManager.saveUser('Vortex Bot', this.botUser);
        }
    }
}

// ============================================
// CAPTCHA SYSTEM
// ============================================
class Captcha {
    static init() {
        this.generateCaptcha();
        this.setupListeners();
    }

    static generateCaptcha() {
        const operations = [
            { q: () => {
                const a = Math.floor(Math.random() * 10) + 1;
                const b = Math.floor(Math.random() * 10) + 1;
                return { question: `Combien font ${a} + ${b} ?`, answer: a + b };
            }},
            { q: () => {
                const a = Math.floor(Math.random() * 10) + 5;
                const b = Math.floor(Math.random() * 5) + 1;
                return { question: `Combien font ${a} - ${b} ?`, answer: a - b };
            }},
            { q: () => {
                const a = Math.floor(Math.random() * 10) + 1;
                const b = Math.floor(Math.random() * 5) + 1;
                return { question: `Combien font ${a} × ${b} ?`, answer: a * b };
            }}
        ];

        const operation = operations[Math.floor(Math.random() * operations.length)].q();
        AppState.captchaQuestion = operation.question;
        AppState.captchaAnswer = operation.answer;
        
        document.getElementById('captchaQuestion').textContent = operation.question;
    }

    static setupListeners() {
        document.getElementById('verifyCaptchaBtn').addEventListener('click', () => {
            this.verifyCaptcha();
        });

        document.getElementById('captchaInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyCaptcha();
            }
        });
    }

    static verifyCaptcha() {
        const input = document.getElementById('captchaInput');
        const answer = parseInt(input.value);
        const error = document.getElementById('captchaError');

        if (answer === AppState.captchaAnswer) {
            // Captcha correct !
            document.getElementById('captchaContainer').classList.add('hidden');
            document.getElementById('authForm').classList.remove('hidden');
            error.classList.remove('active');
        } else {
            // Mauvaise réponse
            error.classList.add('active');
            input.value = '';
            this.generateCaptcha();
        }
    }
}

// ============================================
// AUTHENTICATION SYSTEM
// ============================================
class Auth {
    static init() {
        this.checkAuth();
        this.setupListeners();
        Captcha.init();
    }

    static checkAuth() {
        const savedUser = DataManager.getCurrentUser();
        if (savedUser) {
            AppState.currentUser = savedUser;
            UI.showApp();
            VortexBot.initBot();
        }
    }

    static setupListeners() {
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        document.getElementById('authSwitch').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });
    }

    static toggleMode() {
        AppState.isLoginMode = !AppState.isLoginMode;
        
        const title = document.getElementById('authTitle');
        const subtitle = document.getElementById('authSubtitle');
        const button = document.getElementById('authButton');
        const switchText = document.getElementById('authSwitchText');
        const switchLink = document.getElementById('authSwitch');
        
        if (AppState.isLoginMode) {
            title.textContent = 'Content de te revoir !';
            subtitle.textContent = 'On est heureux de te revoir !';
            button.textContent = 'Connexion';
            switchText.textContent = 'Besoin d\'un compte ?';
            switchLink.textContent = 'S\'inscrire';
        } else {
            title.textContent = 'Créer un compte';
            subtitle.textContent = 'Rejoignez la communauté !';
            button.textContent = 'Continuer';
            switchText.textContent = 'Tu as déjà un compte ?';
            switchLink.textContent = 'Se connecter';
        }
        
        // Clear errors
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('active');
        });
    }

    static handleAuth() {
        const username = document.getElementById('usernameInput').value.trim();
        const email = document.getElementById('emailInput').value.trim();
        const password = document.getElementById('passwordInput').value;
        
        // Clear errors
        document.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('active');
        });
        
        if (!email || !email.includes('@')) {
            document.getElementById('emailError').classList.add('active');
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('passwordError').classList.add('active');
            return;
        }
        
        if (AppState.isLoginMode) {
            this.login(username, email, password);
        } else {
            if (!username || username.length < 2) {
                document.getElementById('usernameError').textContent = 'Le pseudo doit contenir au moins 2 caractères';
                document.getElementById('usernameError').classList.add('active');
                return;
            }
            this.register(username, email, password);
        }
    }

    static login(username, email, password) {
        const users = DataManager.getAllUsers();
        let foundUser = null;
        
        // Chercher par email ou username
        for (const [user, data] of Object.entries(users)) {
            if ((data.email === email || user === username) && data.password === password) {
                foundUser = data;
                break;
            }
        }
        
        if (foundUser) {
            DataManager.setCurrentUser(foundUser);
            UI.showApp();
            VortexBot.initBot();
        } else {
            document.getElementById('emailError').textContent = 'Email/pseudo ou mot de passe incorrect';
            document.getElementById('emailError').classList.add('active');
        }
    }

    static register(username, email, password) {
        const users = DataManager.getAllUsers();
        
        // Vérifier si le pseudo existe déjà
        if (users[username]) {
            document.getElementById('usernameError').textContent = 'Ce pseudo est déjà pris';
            document.getElementById('usernameError').classList.add('active');
            return;
        }
        
        // Vérifier si l'email existe déjà
        for (const user of Object.values(users)) {
            if (user.email === email) {
                document.getElementById('emailError').textContent = 'Cette adresse email est déjà utilisée';
                document.getElementById('emailError').classList.add('active');
                return;
            }
        }
        
        const newUser = {
            username: username,
            email: email,
            password: password,
            tag: DataManager.generateTag(),
            avatar: username.charAt(0).toUpperCase(),
            avatarColor: '#5865f2',
            bannerColor: '#5865f2',
            createdAt: new Date().toISOString()
        };
        
        DataManager.saveUser(username, newUser);
        DataManager.setCurrentUser(newUser);
        UI.showApp();
        VortexBot.initBot();
    }

    static logout() {
        if (confirm('Es-tu sûr de vouloir te déconnecter ?')) {
            localStorage.removeItem('vortexUser');
            AppState.currentUser = null;
            location.reload();
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
