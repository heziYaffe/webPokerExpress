const Spinner = ({ label = 'Loading…' }) => (
    <div className="spinner-wrap" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span>{label}</span>
    </div>
);

export default Spinner;
