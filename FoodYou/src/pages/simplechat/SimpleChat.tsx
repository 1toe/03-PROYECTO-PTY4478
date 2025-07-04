import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonTextarea, IonCard, IonCardContent, IonBackButton, IonButtons } from '@ionic/react';
import { GoogleGenAI } from "@google/genai";
import './SimpleChat.css';

const SimpleChat: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            setResponse('');

            const ai = new GoogleGenAI({ apiKey: "AIzaSyCCv62q9pvMar3FvKr2fzq-shhIckrh0Io" });

            const result = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
            });

            setResponse(result.text || 'No se obtuvo respuesta');
        } catch (error) {
            console.error('Error al obtener respuesta:', error);
            setResponse('Error al comunicarse con la API de Google AI');
        } finally {
            setIsLoading(false);
        }
    };

    // Ejemplo de ejecución inicial
    useEffect(() => {
        const runExample = async () => {
            try {
                setIsLoading(true);

                const ai = new GoogleGenAI({ apiKey: "AIzaSyCCv62q9pvMar3FvKr2fzq-shhIckrh0Io" });

                const result = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: "Explain how AI works in a few words",
                });

                setResponse(result.text || 'No se obtuvo respuesta');
            } catch (error) {
                console.error('Error en el ejemplo inicial:', error);
                setResponse('Error al comunicarse con la API de Google AI');
            } finally {
                setIsLoading(false);
            }
        };

        runExample();
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/app/chat" />
                    </IonButtons>
                    <IonTitle>Chat Simple con Google AI</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonCard>
                    <IonCardContent>
                        <h2>Respuesta:</h2>
                        {isLoading ? (
                            <div className="loading-indicator">
                                <p>Cargando respuesta...</p>
                            </div>
                        ) : (
                            <div className="simple-chat-response">{response}</div>
                        )}
                    </IonCardContent>
                </IonCard>

                <div className="simple-chat-input">
                    <IonTextarea
                        placeholder="Escribe tu pregunta aquí"
                        value={prompt}
                        onIonChange={(e) => setPrompt(e.detail.value!)}
                        rows={4}
                    ></IonTextarea>

                    <IonButton
                        expand="block"
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className="simple-chat-button"
                        color="primary"
                    >
                        {isLoading ? 'Enviando...' : 'Enviar pregunta'}
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SimpleChat;
