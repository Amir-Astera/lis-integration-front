import DashboardView from '../components/DashboardView';

function DashboardPage({ currentUser, uploads, overview, referralRegistrationSummary, workplaceProcessedView, materialProcessedView, workplaceDetailReport }) {
  return (
    <DashboardView 
      currentUser={currentUser} 
      uploads={uploads} 
      overview={overview}
      referralRegistrationSummary={referralRegistrationSummary}
      workplaceProcessedView={workplaceProcessedView}
      materialProcessedView={materialProcessedView}
      workplaceDetailReport={workplaceDetailReport}
    />
  );
}

export default DashboardPage;
