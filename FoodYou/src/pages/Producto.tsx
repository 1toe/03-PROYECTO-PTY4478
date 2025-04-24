import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
      <IonToolbar className="custom-toolbar">
          <IonTitle>Bienvenido producto</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
    

        {/* Contenedor central vacío */}
        <div className="middle-container"></div>

        {/* Contenedor inferior con botones */}
        <div className="bottom-buttons">
          <IonGrid className="no-padding">
            <IonRow className="no-padding">
            <IonCol size="3" className="no-padding">
  <IonButton expand="block" size="small" className="flat-button" routerLink="/producto">
    Productos
  </IonButton>
</IonCol>
<IonCol size="3" className="no-padding">
  <IonButton expand="block" size="small" className="flat-button" routerLink="/mapa">
    Mapa
  </IonButton>
</IonCol>
<IonCol size="3" className="no-padding">
  <IonButton expand="block" size="small" className="flat-button" routerLink="/home">
    HomeList
  </IonButton>
</IonCol>
<IonCol size="3" className="no-padding">
  <IonButton expand="block" size="small" className="flat-button" routerLink="/perfil">
    Perfil
  </IonButton>
</IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
