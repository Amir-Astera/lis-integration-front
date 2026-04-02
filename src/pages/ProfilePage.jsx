import ProfileView from '../components/ProfileView';

function ProfilePage({ currentUser, isAdmin }) {
  return <ProfileView currentUser={currentUser} isAdmin={isAdmin} />;
}

export default ProfilePage;
