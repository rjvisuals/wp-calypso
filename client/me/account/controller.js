import i18n, { useTranslate } from 'i18n-calypso';
import page from 'page';
import DocumentHead from 'calypso/components/data/document-head';
import AccountComponent, { noticeId as meSettingsNoticeId } from 'calypso/me/account/main';
import { successNotice } from 'calypso/state/notices/actions';

export function account( context, next ) {
	// Update the url and show the notice after a redirect
	if ( context.query && context.query.updated === 'success' ) {
		context.store.dispatch(
			successNotice( i18n.translate( 'Settings saved successfully!' ), {
				displayOnNextPage: true,
				id: meSettingsNoticeId,
			} )
		);
		page.replace( context.pathname );
	}

	const AccountTitle = () => {
		const translate = useTranslate();

		return <DocumentHead title={ translate( 'Account Settings', { textOnly: true } ) } />;
	};

	context.primary = (
		<>
			<AccountTitle />
			<AccountComponent path={ context.path } />
		</>
	);
	next();
}
