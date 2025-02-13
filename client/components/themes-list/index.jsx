import { localize } from 'i18n-calypso';
import { isEqual, isEmpty, times } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import EmptyContent from 'calypso/components/empty-content';
import InfiniteScroll from 'calypso/components/infinite-scroll';
import Theme from 'calypso/components/theme';
import { DEFAULT_THEME_QUERY } from 'calypso/state/themes/constants';
import { getThemesBookmark } from 'calypso/state/themes/themes-ui/selectors';

import './style.scss';

const noop = () => {};

export class ThemesList extends Component {
	static propTypes = {
		themes: PropTypes.array.isRequired,
		emptyContent: PropTypes.element,
		loading: PropTypes.bool.isRequired,
		fetchNextPage: PropTypes.func.isRequired,
		getButtonOptions: PropTypes.func,
		getScreenshotUrl: PropTypes.func,
		onScreenshotClick: PropTypes.func.isRequired,
		onMoreButtonClick: PropTypes.func,
		getActionLabel: PropTypes.func,
		isActive: PropTypes.func,
		getPrice: PropTypes.func,
		isInstalling: PropTypes.func,
		// i18n function provided by localize()
		translate: PropTypes.func,
		placeholderCount: PropTypes.number,
		bookmarkRef: PropTypes.oneOfType( [
			PropTypes.func,
			PropTypes.shape( { current: PropTypes.any } ),
		] ),
		siteId: PropTypes.number,
	};

	static defaultProps = {
		loading: false,
		themes: [],
		fetchNextPage: noop,
		placeholderCount: DEFAULT_THEME_QUERY.number,
		optionsGenerator: () => [],
		getActionLabel: () => '',
		isActive: () => false,
		getPrice: () => '',
		isInstalling: () => false,
	};

	fetchNextPage = ( options ) => {
		this.props.fetchNextPage( options );
	};

	shouldComponentUpdate( nextProps ) {
		return (
			nextProps.loading !== this.props.loading ||
			! isEqual( nextProps.themes, this.props.themes ) ||
			nextProps.getButtonOptions !== this.props.getButtonOptions ||
			nextProps.getScreenshotUrl !== this.props.getScreenshotUrl ||
			nextProps.onScreenshotClick !== this.props.onScreenshotClick ||
			nextProps.onMoreButtonClick !== this.props.onMoreButtonClick
		);
	}

	renderTheme( theme, index ) {
		if ( isEmpty( theme ) ) {
			return null;
		}
		// Decide if we should pass ref for bookmark.
		const { themesBookmark, siteId } = this.props;
		const bookmarkRef = themesBookmark === theme.id ? this.props.bookmarkRef : null;

		return (
			<Theme
				key={ 'theme-' + theme.id }
				buttonContents={ this.props.getButtonOptions( theme.id ) }
				screenshotClickUrl={
					this.props.getScreenshotUrl && this.props.getScreenshotUrl( theme.id )
				}
				onScreenshotClick={ this.props.onScreenshotClick }
				onMoreButtonClick={ this.props.onMoreButtonClick }
				actionLabel={ this.props.getActionLabel( theme.id ) }
				index={ index }
				theme={ theme }
				active={ this.props.isActive( theme.id ) }
				price={ this.props.getPrice( theme.id ) }
				installing={ this.props.isInstalling( theme.id ) }
				upsellUrl={ this.props.upsellUrl }
				bookmarkRef={ bookmarkRef }
				siteId={ siteId }
			/>
		);
	}

	renderLoadingPlaceholders() {
		return times( this.props.placeholderCount, function ( i ) {
			return (
				<Theme
					key={ 'placeholder-' + i }
					theme={ { id: 'placeholder-' + i, name: 'Loading…' } }
					isPlaceholder={ true }
				/>
			);
		} );
	}

	// Invisible trailing items keep all elements same width in flexbox grid.
	renderTrailingItems() {
		const NUM_SPACERS = 11; // gives enough spacers for a theoretical 12 column layout
		return times( NUM_SPACERS, function ( i ) {
			return <div className="themes-list__spacer" key={ 'themes-list__spacer-' + i } />;
		} );
	}

	renderEmpty() {
		return (
			this.props.emptyContent || (
				<EmptyContent
					title={ this.props.translate( 'Sorry, no themes found.' ) }
					line={ this.props.translate( 'Try a different search or more filters?' ) }
				/>
			)
		);
	}

	render() {
		if ( ! this.props.loading && this.props.themes.length === 0 ) {
			return this.renderEmpty();
		}

		return (
			<div className="themes-list">
				{ this.props.themes.map( this.renderTheme, this ) }
				{ this.props.loading && this.renderLoadingPlaceholders() }
				{ this.renderTrailingItems() }
				<InfiniteScroll nextPageMethod={ this.fetchNextPage } />
			</div>
		);
	}
}

const mapStateToProps = ( state ) => ( {
	themesBookmark: getThemesBookmark( state ),
} );

export default connect( mapStateToProps )( localize( ThemesList ) );
