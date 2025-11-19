import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './components/Login';
import Layout from './components/Layout';
import CreateQuiz from './components/CreateQuiz';
import QuizList from './components/QuizList';
import TakeQuiz from './components/TakeQuiz';
import Analytics from './components/Analytics';
import MyResults from './components/MyResults';
import Profile from './components/Profile';
import QuizPreview from './components/QuizPreview';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('quiz-list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleTakeQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setCurrentView('take-quiz');
  };

  const handleQuizComplete = () => {
    setSelectedQuizId(null);
    setCurrentView('my-results');
  };

  const handlePreviewQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setCurrentView('quiz-preview');
  };

  const handleClosePreview = () => {
    setSelectedQuizId(null);
    setCurrentView('quiz-list');
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setSelectedQuizId(null);
  };

  const renderContent = () => {
    if (currentView === 'take-quiz' && selectedQuizId) {
      return <TakeQuiz quizId={selectedQuizId} onComplete={handleQuizComplete} />;
    }

    switch (currentView) {
      case 'create-quiz':
        return <CreateQuiz />;
      case 'quiz-list':
        return <QuizList onTakeQuiz={handleTakeQuiz} onPreviewQuiz={handlePreviewQuiz} />;
      case 'quiz-preview':
        return selectedQuizId
          ? <QuizPreview quizId={selectedQuizId} onBack={handleClosePreview} />
          : <QuizList onTakeQuiz={handleTakeQuiz} onPreviewQuiz={handlePreviewQuiz} />;
      case 'analytics':
        return <Analytics />;
      case 'my-results':
        return <MyResults />;
      case 'profile':
        return <Profile />;
      default:
        return <QuizList onTakeQuiz={handleTakeQuiz} onPreviewQuiz={handlePreviewQuiz} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
