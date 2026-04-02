import UploadsView from '../components/UploadsView';

function UploadsPage({ uploads, onRefresh }) {
  return <UploadsView uploads={uploads} onRefresh={onRefresh} />;
}

export default UploadsPage;
