export default function DashboardLoading() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:px-6'>
      <div className='animate-pulse'>
        <div className='bg-muted mb-2 h-7 w-48 rounded' />
        <div className='bg-muted h-4 w-96 rounded' />
      </div>
      <div className='flex flex-1 animate-pulse flex-col gap-4'>
        <div className='bg-muted h-10 w-full rounded' />
        <div className='bg-muted h-96 w-full rounded-lg' />
        <div className='bg-muted h-10 w-full rounded' />
      </div>
    </div>
  );
}
