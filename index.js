const Alexa = require('ask-sdk-core');
const OpenAIApi = require("openai");

const SKILL_NAME = "chat connect";
const HELP_MESSAGE = "Was möchtest du wissen?";
const HELP_REPROMPT = "Was möchtest du jetzt wissen?";
const FALLBACK_MESSAGE = "Was möchtest du wissen?"
const FALLBACK_REPROMPT = "Was möchtest du jetzt wissen?"
const STOP_MESSAGE = "Okay, ich stoppe meine Anfrage.";
const ERROR_MESSAGE = "Entschuldige. Es ist zu einem Fehler gekommen.";

const configuration = new OpenAIApi.Configuration({
  organization: process.env.CHATGPT_ORG,
  apiKey: process.env.CHATGPT_APIKEY
})


const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const response = "Willkommen bei chat connect. Ich kann fragen an Chat GPT weiterleiten und für dich beantworten. ";
    const speakOutput = response;

    return handlerInput.responseBuilder
      .speak(speakOutput + HELP_MESSAGE)
      .withSimpleCard(SKILL_NAME, response)
      .reprompt(HELP_MESSAGE)
      .getResponse();
  },
};

const GetGptResponseHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
       || (request.type === 'IntentRequest'
        && request.intent.name === 'GetGptResponseHandler');
  },
  async handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const question = slots['question'].value;
    
    console.log("Neue Nutzerfrage: " + question);
    
    // send request to chat gpt
    const openai = new OpenAIApi.OpenAIApi(configuration);
    
    try {
      const gptResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: question
        }]
      })
    
      const gptAnswer = gptResponse.data.choices[0].message.content;
      console.log("gptAnswer: " + gptAnswer);
      console.log("gptAnswer: typeof " + typeof gptAnswer);
      const speakOutput = gptAnswer;

      return handlerInput.responseBuilder
          .speak(speakOutput + " " + HELP_REPROMPT)
          .withSimpleCard(SKILL_NAME, speakOutput)
          .reprompt(HELP_REPROMPT)
          .getResponse();
    } catch(err) {
      return handlerInput.responseBuilder
          .speak(ERROR_MESSAGE)
          .reprompt(ERROR_MESSAGE)
          .getResponse();
    }
  }
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return handlerInput.responseBuilder
      .speak(ERROR_MESSAGE)
      .reprompt(ERROR_MESSAGE)
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GetGptResponseHandler,
        HelpHandler,
        ExitHandler,
        FallbackHandler,
        SessionEndedRequestHandler)
  .addErrorHandlers(
      ErrorHandler)
  .lambda();
