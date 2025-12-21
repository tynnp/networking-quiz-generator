import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import CreateQuiz from './components/CreateQuiz';
import QuizList from './components/QuizList';
import TakeQuiz from './components/TakeQuiz';
import Analytics from './components/Analytics';
import MyResults from './components/MyResults';
import Profile from './components/Profile';
import QuizPreview from './components/QuizPreview';
import AttemptDetail from './components/AttemptDetail';
import AiResultFeedback from './components/AiResultFeedback';
import AdminUserManagement from './components/AdminUserManagement';
import AnalysisHistory from './components/AnalysisHistory';
import CommunityChat from './components/CommunityChat';
import QuizDiscussion from './components/QuizDiscussion';
import QuizDiscussionChat from './components/QuizDiscussionChat';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState('quiz-list');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [selectedDiscussionQuiz, setSelectedDiscussionQuiz] = useState<{ id: string; title: string } | null>(null);
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast('Tính năng này đã bị vô hiệu hóa để bảo vệ nội dung.', 'warning');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn F12
      if (e.key === 'F12') {
        e.preventDefault();
        showToast('DevTools đã bị vô hiệu hóa.', 'warning');
      }

      // Chặn Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        showToast('DevTools đã bị vô hiệu hóa.', 'warning');
      }

      // Chặn Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        showToast('Tính năng xem nguồn đã bị vô hiệu hóa.', 'warning');
      }

      // Chặn Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        showToast('Tính năng lưu trang đã bị vô hiệu hóa.', 'warning');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // Phát hiện DevTools chủ động
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        showToast('Phát hiện DevTools đang mở. Vui lòng đóng lại để tiếp tục.', 'error');
      }
    };

    const interval = setInterval(detectDevTools, 2000);

    const debuggerTrap = setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.clear();
        console.log('%cDừng lại!', 'color: red; font-size: 50px; font-weight: bold;');
        console.log('%cĐây là tính năng dành cho nhà phát triển. Nếu bạn được yêu cầu sao chép-dán bất kỳ thứ gì ở đây, đó có thể là một cuộc tấn công lừa đảo.', 'font-size: 20px;');
      }
    }, 5000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
      clearInterval(debuggerTrap);
    };
  }, [showToast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return <Register onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthMode('register')} />;
  }

  const handleTakeQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setSelectedAttemptId(null);
    setCurrentView('take-quiz');
  };

  const handleQuizComplete = (attemptId: string) => {
    setSelectedQuizId(null);
    setSelectedAttemptId(attemptId);
    setCurrentView('attempt-detail');
  };

  const handleAiAnalyzeAttempt = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setCurrentView('attempt-ai-feedback');
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
    setSelectedAttemptId(null);
    setSelectedDiscussionQuiz(null);
  };

  const handleOpenDiscussionChat = (quizId: string, quizTitle: string) => {
    setSelectedDiscussionQuiz({ id: quizId, title: quizTitle });
    setCurrentView('quiz-discussion-chat');
  };

  const handleBackFromDiscussionChat = () => {
    setSelectedDiscussionQuiz(null);
    setCurrentView('quiz-discussion');
  };

  const handleViewAttemptDetail = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setCurrentView('attempt-detail');
  };

  const handleBackFromAttemptDetail = () => {
    setCurrentView('my-results');
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
        return <Analytics onAiAnalyzeAttempt={handleAiAnalyzeAttempt} />;
      case 'my-results':
        return <MyResults onViewAttemptDetail={handleViewAttemptDetail} />;
      case 'attempt-ai-feedback':
        return selectedAttemptId
          ? (
            <AiResultFeedback
              attemptId={selectedAttemptId}
              onViewDetail={() => setCurrentView('attempt-detail')}
              onBack={handleBackFromAttemptDetail}
            />
          )
          : <MyResults onViewAttemptDetail={handleViewAttemptDetail} />;
      case 'attempt-detail':
        return selectedAttemptId
          ? <AttemptDetail attemptId={selectedAttemptId} onBack={handleBackFromAttemptDetail} />
          : <MyResults onViewAttemptDetail={handleViewAttemptDetail} />;
      case 'profile':
        return <Profile />;
      case 'analysis-history':
        return <AnalysisHistory />;
      case 'community-chat':
        return <CommunityChat />;
      case 'quiz-discussion':
        return <QuizDiscussion onOpenChat={handleOpenDiscussionChat} />;
      case 'quiz-discussion-chat':
        return selectedDiscussionQuiz
          ? <QuizDiscussionChat
            quizId={selectedDiscussionQuiz.id}
            quizTitle={selectedDiscussionQuiz.title}
            onBack={handleBackFromDiscussionChat}
          />
          : <QuizDiscussion onOpenChat={handleOpenDiscussionChat} />;
      case 'admin-users':
        return <AdminUserManagement />;
      default:
        return <QuizList onTakeQuiz={handleTakeQuiz} onPreviewQuiz={handlePreviewQuiz} />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onNavigate={handleNavigate}
      isSnowEnabled={isSnowEnabled}
      onToggleSnow={() => setIsSnowEnabled(prev => !prev)}
    >
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
