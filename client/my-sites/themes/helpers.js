import { isMagnificentLocale } from '@automattic/i18n-utils';
import { mapValues } from 'lodash';
import titlecase from 'to-title-case';
import { gaRecordEvent } from 'calypso/lib/analytics/ga';

export function trackClick( componentName, eventName, verb = 'click' ) {
	const stat = `${ componentName } ${ eventName } ${ verb }`;
	gaRecordEvent( 'Themes', titlecase( stat ) );
}

export function addTracking( options ) {
	return mapValues( options, appendActionTracking );
}

function appendActionTracking( option, name ) {
	const { action } = option;

	return Object.assign( {}, option, {
		action: ( t ) => {
			action && action( t );
			trackClick( 'more button', name );
		},
	} );
}

export function getAnalyticsData( path, { filter, vertical, tier, site_id } ) {
	let analyticsPath = '/themes';
	let analyticsPageTitle = 'Themes';

	if ( vertical ) {
		analyticsPath += `/${ vertical }`;
	}

	if ( tier ) {
		analyticsPath += `/${ tier }`;
	}

	if ( filter ) {
		analyticsPath += `/filter/${ filter }`;
	}

	if ( site_id ) {
		analyticsPath += '/:site';
		analyticsPageTitle += ' > Single Site';
	}

	if ( tier ) {
		analyticsPageTitle += ` > Type > ${ titlecase( tier ) }`;
	}

	return { analyticsPath, analyticsPageTitle };
}

export function localizeThemesPath( path, locale, isLoggedOut = true ) {
	const shouldPrefix = isLoggedOut && isMagnificentLocale( locale ) && path.startsWith( '/theme' );

	return shouldPrefix ? `/${ locale }${ path }` : path;
}
