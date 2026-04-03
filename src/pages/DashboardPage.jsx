import DashboardView from '../components/DashboardView';

function DashboardPage({ token, currentUser, uploads, overview, referralRegistrationSummary, workplaceProcessedView, materialProcessedView, workplaceDetailReport }) {
  return (
    <DashboardView
      token={token}
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
