<script>
	import Header from './Header.svelte';
	import logo from '$lib/images/svelte-logo.svg';
	import './styles.css';
	import { base } from '$app/paths';
</script>

<div class="app">
	<!-- <Header /> -->
	<!-- This is an example component -->
	<div class="flex flex-row h-full">
		<!-- Sidebar -->
		<nav class="bg-gray-900 w-20 justify-between flex flex-col">
			<div class="mt-10 mb-10">
				<a href="{base}/">
					<img src={logo} class="rounded-full w-10 h-10 mb-3 mx-auto" />
				</a>
				<div class="mt-10">
					<ul>
						<li class="mb-6">
							<a href="{base}/flow">
								<span>
									<svg
										class="fill-current h-5 w-5 text-gray-300 mx-auto hover:text-green-500"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 13H7v5h5v2H5V10h2v1h5v2M8
                          4v2H4V4h4m2-2H2v6h8V2m10 9v2h-4v-2h4m2-2h-8v6h8V9m-2
                          9v2h-4v-2h4m2-2h-8v6h8v-6z"
										></path>
									</svg>
								</span>
							</a>
						</li>
						<li>
							<a href="{base}/dashboard">
								<span>
									<svg
										class="fill-current h-5 w-5 text-gray-300 mx-auto hover:text-green-500"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M22.775 8C22.9242 8.65461 23 9.32542 23 10H14V1C14.6746 1 15.3454 1.07584 16 1.22504C16.4923 1.33724 16.9754 1.49094 17.4442 1.68508C18.5361 2.13738 19.5282 2.80031 20.364 3.63604C21.1997 4.47177 21.8626 5.46392 22.3149 6.55585C22.5091 7.02455 22.6628 7.5077 22.775 8ZM20.7082 8C20.6397 7.77018 20.5593 7.54361 20.4672 7.32122C20.1154 6.47194 19.5998 5.70026 18.9497 5.05025C18.2997 4.40024 17.5281 3.88463 16.6788 3.53284C16.4564 3.44073 16.2298 3.36031 16 3.2918V8H20.7082Z"
											fill="currentColor"
										/>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M1 14C1 9.02944 5.02944 5 10 5C10.6746 5 11.3454 5.07584 12 5.22504V12H18.775C18.9242 12.6546 19 13.3254 19 14C19 18.9706 14.9706 23 10 23C5.02944 23 1 18.9706 1 14ZM16.8035 14H10V7.19648C6.24252 7.19648 3.19648 10.2425 3.19648 14C3.19648 17.7575 6.24252 20.8035 10 20.8035C13.7575 20.8035 16.8035 17.7575 16.8035 14Z"
											fill="currentColor"
										/>
									</svg>
								</span>
							</a>
						</li>
					</ul>
				</div>
			</div>
			<div class="mb-4">
				<a href="#">
					<span>
						<svg
							class="fill-current h-5 w-5 text-gray-300 mx-auto hover:text-red-500"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M13 4.00894C13.0002 3.45665 12.5527 3.00876 12.0004 3.00854C11.4481 3.00833 11.0002 3.45587 11 4.00815L10.9968 12.0116C10.9966 12.5639 11.4442 13.0118 11.9965 13.012C12.5487 13.0122 12.9966 12.5647 12.9968 12.0124L13 4.00894Z"
								fill="currentColor"
							/>
							<path
								d="M4 12.9917C4 10.7826 4.89541 8.7826 6.34308 7.33488L7.7573 8.7491C6.67155 9.83488 6 11.3349 6 12.9917C6 16.3054 8.68629 18.9917 12 18.9917C15.3137 18.9917 18 16.3054 18 12.9917C18 11.3348 17.3284 9.83482 16.2426 8.74903L17.6568 7.33481C19.1046 8.78253 20 10.7825 20 12.9917C20 17.41 16.4183 20.9917 12 20.9917C7.58172 20.9917 4 17.41 4 12.9917Z"
								fill="currentColor"
							/>
						</svg>
					</span>
				</a>
			</div>
		</nav>
		<main class=" text-gray-700 bg-gray-200 h-screen w-screen">
			<slot />
		</main>
	</div>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	/* main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	} */

	/* footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	} */
</style>
