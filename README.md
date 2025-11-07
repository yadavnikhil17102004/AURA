# 🤖 Simple ChatBot - OpenRouter

A beautiful, modern, and user-friendly chatbot interface that connects to the OpenRouter API. This project provides a complete chat experience with real-time messaging, error handling, and a responsive design.

## ✨ Features

- **Modern UI**: Clean, responsive design with smooth animations
- **OpenRouter Integration**: Uses OpenRouter API to access multiple AI models
- **Real-time Chat**: Instant messaging with typing indicators
- **Error Handling**: Comprehensive error management with user-friendly messages
- **API Key Management**: Secure local storage of API keys
- **Keyboard Shortcuts**: Enhanced user experience with hotkeys
- **Export Functionality**: Download chat history as JSON
- **Mobile Responsive**: Works perfectly on all device sizes
- **Conversation Memory**: Maintains context within the chat session

## 🚀 Quick Start

### Prerequisites

1. **OpenRouter API Key**: You'll need an API key from [OpenRouter](https://openrouter.ai/keys)

### Installation

1. **Clone or download** this project to your local machine
2. **Open** the `index.html` file in your web browser
3. **Enter your OpenRouter API key** in the input field and click "Save"
4. **Start chatting** with the AI!

That's it! No build process or server setup required.

## 📋 Detailed Setup Guide

### Step 1: Get Your OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the key (it starts with `sk-or-...`)

### Step 2: Configure the Chatbot

1. **Open the chatbot**: Double-click on `index.html` to open in your browser
2. **Enter API key**: Paste your API key in the "Enter your OpenRouter API key here..." field
3. **Save**: Click the "Save" button
4. **Verify**: The input field should show dots (•••) and turn green, indicating success

### Step 3: Start Chatting

1. **Type your message** in the text area at the bottom
2. **Send**: Press Enter or click the Send button
3. **Wait**: The AI will respond with a typing indicator
4. **Continue**: Ask follow-up questions to maintain conversation context

## 🎯 Usage

### Basic Chatting

- Type your message in the text area
- Press `Enter` to send (or `Shift+Enter` for new lines)
- The AI will respond based on your input
- Conversation history is maintained during the session

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus the message input
- `Ctrl/Cmd + L`: Clear chat history
- `Ctrl/Cmd + E`: Export chat as JSON file

### Features

- **Auto-save**: Your API key is saved locally in your browser
- **Export**: Download conversation history as JSON
- **Clear Chat**: Reset the conversation
- **Responsive**: Works on desktop, tablet, and mobile

## 🛠️ Configuration

### Available Models

The chatbot is configured to use `anthropic/claude-3-haiku` by default. You can modify this in the `script.js` file:

```javascript
// OpenRouter API configuration
const DEFAULT_MODEL = 'anthropic/claude-3-haiku'; // Change this to your preferred model
```

### Popular OpenRouter Models

- `anthropic/claude-3-haiku` - Fast and efficient
- `anthropic/claude-3-sonnet` - Balanced performance
- `anthropic/claude-3-opus` - Most capable
- `openai/gpt-4` - OpenAI's GPT-4
- `google/gemini-pro` - Google's Gemini
- `meta-llama/llama-2-70b-chat` - Meta's Llama

Visit [OpenRouter Models](https://openrouter.ai/models) for the complete list.

### Customization

You can customize various aspects in `script.js`:

- **API URL**: Change `OPENROUTER_API_URL` if needed
- **Max Tokens**: Modify `max_tokens` in the API call
- **Temperature**: Adjust `temperature` for creativity (0.0-1.0)
- **System Message**: Change the AI's behavior instructions

## 🏗️ File Structure

```
simple-chatbot/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🔧 Technical Details

### API Integration

- **Endpoint**: OpenRouter Chat Completions API
- **Method**: POST
- **Authentication**: Bearer token in Authorization header
- **Request Format**: OpenAI-compatible chat completion format

### Security

- **API Key Storage**: Stored locally in browser's localStorage
- **No Server**: Runs entirely client-side
- **HTTPS**: Recommended to run over HTTPS for security

### Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **JavaScript**: ES6+ features used
- **Local Storage**: Required for API key persistence

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key" Error**
- Verify your API key is correct
- Check if the key is active in your OpenRouter account
- Ensure you have sufficient credits

**"Rate limit exceeded"**
- Wait a few seconds between messages
- Check your API usage limits in OpenRouter dashboard
- Consider using a rate limit handler

**Messages not sending**
- Check browser console for JavaScript errors
- Ensure you have an active internet connection
- Verify the API key is saved correctly

**UI not loading properly**
- Try refreshing the page
- Clear browser cache
- Disable browser extensions that might interfere

### Debug Mode

Open browser developer tools (F12) to view console messages. The chatbot logs helpful information for troubleshooting.

## 💰 Cost and Usage

### OpenRouter Pricing

- **Pay-per-use**: You only pay for the tokens you consume
- **Rate limits**: Vary by model and account tier
- **Free tier**: Some models have free usage limits
- **Credits**: Purchase credits as needed

### Token Usage

- **Input**: Each message costs tokens
- **Output**: AI responses consume tokens
- **History**: Conversation context adds to token usage
- **Optimization**: Chat history is limited to last 10 exchanges

## 🔒 Privacy and Security

- **Local Storage**: API key is stored only in your browser
- **No Data Collection**: No personal data is transmitted except to OpenRouter
- **Client-Side Only**: No server-side data storage
- **HTTPS Recommended**: For secure API communication

## 🤝 Contributing

Feel free to contribute to this project by:

1. **Bug Reports**: Submit issues for bugs or problems
2. **Feature Requests**: Suggest new features or improvements
3. **Code Contributions**: Submit pull requests with enhancements
4. **Documentation**: Improve README or add examples

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **OpenRouter**: For providing access to multiple AI models
- **Anthropic**: For the Claude models
- **Modern Web Standards**: For enabling rich web applications

## 📞 Support

If you need help:

1. **Check the troubleshooting section** above
2. **Open browser console** for error messages
3. **Review OpenRouter documentation** for API-related issues
4. **Create an issue** for bugs or feature requests

---

**Happy Chatting! 🎉**

*Built with ❤️ using modern web technologies*