import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { AuthProvider, useAuth } from './AuthContext';

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

/* Theme variables */
import './theme/variables.css';

// Configurar Ionic para usar el modo Material Design y plataforma de escritorio
setupIonicReact({
  mode: 'md',
  rippleEffect: true,
  animated: true
});

const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <IonSpinner name="crescent" />
      <div>Cargando...</div>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Siempre redirigir a login si no hay usuario
  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Redirect to="/app/home" />;
};

const App: React.FC = () => {
  useEffect(() => {

    const handleTouchMove = (e: TouchEvent) => {

      if (e.target &&
        (e.target as HTMLElement).classList &&
        (e.target as HTMLElement).classList.contains('prevent-touch')) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };


    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            {/* Rutas públicas - accesibles sin autenticación */}
            <Route exact path="/login">
              <LoginPage />
            </Route>
            <Route exact path="/register">
              <RegisterPage />
            </Route>

            {/* Ruta principal redirecciona según autenticación */}
            <Route exact path="/">
              <RootRedirect />
            </Route>

            {/* Rutas de la aplicación protegidas con sistema de tabs */}
            <Route path="/app">
              <IonTabs>
                <IonRouterOutlet>
                  <PrivateRoute exact path="/app/home" component={HomePage} />
                  <PrivateRoute exact path="/app/map" component={MapPage} />
                  <PrivateRoute exact path="/app/profile" component={ProfilePage} />
                  <PrivateRoute exact path="/app/lists" component={ListsPage} />
                  <PrivateRoute exact path="/app/lists/create" component={ListDetailsPage} />
                  <PrivateRoute exact path="/app/lists/edit/:id" component={ListDetailsPage} />
                  <PrivateRoute exact path="/app/lists/:id" component={ListDetailsPage} />
                  <PrivateRoute exact path="/app/recommendations" component={RecommendationsPage} />

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
            </Route>

            {/* Redirección para rutas antiguas */}
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
      </AuthProvider>
    </IonApp>
  );
};

export default App;
