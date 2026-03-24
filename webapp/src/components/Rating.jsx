function Rating({ score, onGenerate, disabled, loading, glowReady }) {
  return (
    <div className="rating-inline">
      <div className="rating-group">
        {score != null ? (
          <>
            <div className="rating-score">{score}</div>
            <div className="rating-label">Rating</div>
          </>
        ) : (
          <div className="rating-label">No rating yet</div>
        )}
      </div>
      <div className="generate-btn-wrapper">
        <button
          className={`generate-btn ${glowReady ? 'glow-ready' : ''}`}
          onClick={(e) => { e.stopPropagation(); onGenerate() }}
          disabled={disabled}
          title="Generate outfit"
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
        </button>
      </div>
    </div>
  )
}

export default Rating
