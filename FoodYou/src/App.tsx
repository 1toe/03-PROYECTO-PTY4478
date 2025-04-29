import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/home/HomePage';
import ProfilePage from './pages/profile/ProfilePage';
import MapPage from './pages/map/MapPage';
import ListsPage from './pages/lists/ListsPage';
import ListDetailsPage from './pages/lists/ListDetailsPage';
import RecommendationsPage from './pages/recommendations/RecommendationsPage';
import PrivateRoute from './components/PrivateRoute';

import { home, map, person, list, newspaper } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Ionic Dark Mode */
/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Rutas de autenticación - EXCLUIDA del sistema de tabs */}
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/register">
          <RegisterPage />
        </Route>

        {/* Ruta principal redirecciona a /login o /app/home según autenticación */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>

        {/* Rutas de la aplicación protegidas con sistema de tabs */}
        <Route path="/app">
          <PrivateRoute>
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/app/home">
                  <HomePage />
                </Route>
                <Route exact path="/app/map">
                  <MapPage />
                </Route>
                <Route exact path="/app/profile">
                  <ProfilePage />
                </Route>
                <Route exact path="/app/lists">
                  <ListsPage />
                </Route>
                <Route exact path="/app/lists/create">
                  <ListDetailsPage />
                </Route>
                <Route exact path="/app/lists/edit/:id">
                  <ListDetailsPage />
                </Route>
                <Route exact path="/app/lists/:id">
                  <ListDetailsPage />
                </Route>
                <Route exact path="/app/recommendations">
                  <RecommendationsPage />
                </Route>
                <Route>
                  <Redirect to="/app/home" />
                </Route>
              </IonRouterOutlet>

              <IonTabBar slot="bottom">
                <IonTabButton tab="home" href="/app/home">
                  <IonIcon icon={home} />
                  <IonLabel>Inicio</IonLabel>
                </IonTabButton>

                <IonTabButton tab="lists" href="/app/lists">
                  <IonIcon icon={list} />
                  <IonLabel>Listas</IonLabel>
                </IonTabButton>

                <IonTabButton tab="map" href="/app/map">
                  <IonIcon icon={map} />
                  <IonLabel>Mapa</IonLabel>
                </IonTabButton>

                <IonTabButton tab="recommendations" href="/app/recommendations">
                  <IonIcon icon={newspaper} />
                  <IonLabel>Recomendar</IonLabel>
                </IonTabButton>

                <IonTabButton tab="profile" href="/app/profile">
                  <IonIcon icon={person} />
                  <IonLabel>Perfil</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          </PrivateRoute>
        </Route>

        {/* Redirección para rutas antiguas */}
        <Route exact path="/">
          <Redirect to="/app/home" />
        </Route>
        <Route exact path="/profile">
          <Redirect to="/app/profile" />
        </Route>
        <Route exact path="/recommendations">
          <Redirect to="/app/recommendations" />
        </Route>
        <Route exact path="/lists">
          <Redirect to="/app/lists" />
        </Route>
        <Route exact path="/dashboard">
          <Redirect to="/app/home" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
